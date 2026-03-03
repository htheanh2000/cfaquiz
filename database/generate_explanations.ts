/**
 * Script to generate AI explanations for CFA quiz questions
 * Handles Neon DB rate limits with batch processing and delays
 * 
 * Usage: npx ts-node database/generate_explanations.ts
 * Or: npx tsx database/generate_explanations.ts
 */

import { Pool } from 'pg';
import OpenAI from 'openai';

// Configuration
const CONFIG = {
  // Batch size for processing questions
  BATCH_SIZE: 5,
  // Delay between batches (ms) - to handle Neon rate limits
  BATCH_DELAY_MS: 2000,
  // Delay between individual API calls (ms)
  API_CALL_DELAY_MS: 500,
  // Only process questions with explanation shorter than this
  MIN_EXPLANATION_LENGTH: 100,
  // Max retries for failed operations
  MAX_RETRIES: 3,
  // Retry delay (ms)
  RETRY_DELAY_MS: 5000,
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cfaquiz',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 5, // Lower pool size for rate limiting
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DB_HOST?.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : false,
});

interface Question {
  id: number;
  question_text: string;
  explanation: string | null;
  subject_name: string;
  level_name: string;
  answers: Array<{
    answer_text: string;
    is_correct: boolean;
  }>;
}

// Sleep utility
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry utility with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = CONFIG.MAX_RETRIES,
  delay = CONFIG.RETRY_DELAY_MS
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      console.log(`  Retrying in ${delay / 1000}s... (${retries} retries left)`);
      await sleep(delay);
      return withRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

// Fetch questions that need explanations
async function getQuestionsNeedingExplanations(): Promise<Question[]> {
  const query = `
    SELECT 
      q.id,
      q.question_text,
      q.explanation,
      s.name as subject_name,
      l.name as level_name,
      COALESCE(
        json_agg(
          json_build_object(
            'answer_text', a.answer_text,
            'is_correct', a.is_correct
          ) ORDER BY a.order_index
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'
      ) as answers
    FROM questions q
    LEFT JOIN subjects s ON q.subject_id = s.id
    LEFT JOIN levels l ON q.level_id = l.id
    LEFT JOIN answers a ON a.question_id = q.id
    WHERE q.explanation IS NULL 
       OR LENGTH(q.explanation) < $1
    GROUP BY q.id, q.question_text, q.explanation, s.name, l.name
    ORDER BY q.id
  `;

  const result = await pool.query(query, [CONFIG.MIN_EXPLANATION_LENGTH]);
  return result.rows.map(row => ({
    ...row,
    answers: typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers,
  }));
}

// Generate explanation using OpenAI
async function generateExplanation(question: Question): Promise<string> {
  const correctAnswer = question.answers.find(a => a.is_correct);
  const incorrectAnswers = question.answers.filter(a => !a.is_correct);

  const prompt = `You are a CFA exam tutor. Generate a detailed, educational explanation for the following CFA exam question.

Subject: ${question.subject_name}
Level: ${question.level_name}

Question: ${question.question_text}

Answer Options:
${question.answers.map((a, i) => `${String.fromCharCode(65 + i)}. ${a.answer_text}${a.is_correct ? ' (Correct)' : ''}`).join('\n')}

Please provide:
1. A clear explanation of why the correct answer is right
2. Brief explanations of why the other options are incorrect
3. Key concepts or formulas that help solve this type of question
4. Any relevant CFA curriculum references if applicable

Keep the explanation concise but thorough (200-400 words). Use clear language suitable for CFA candidates. If mathematical formulas are needed, use LaTeX format with $ for inline and $$ for block equations.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert CFA exam tutor. Provide clear, accurate, and educational explanations.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 800,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

// Update question explanation in database
async function updateExplanation(questionId: number, explanation: string): Promise<void> {
  await withRetry(async () => {
    await pool.query(
      'UPDATE questions SET explanation = $1, updated_at = NOW() WHERE id = $2',
      [explanation, questionId]
    );
  });
}

// Process questions in batches
async function processQuestions(questions: Question[]): Promise<void> {
  const totalQuestions = questions.length;
  let processed = 0;
  let failed = 0;

  console.log(`\nProcessing ${totalQuestions} questions in batches of ${CONFIG.BATCH_SIZE}...`);
  console.log(`Batch delay: ${CONFIG.BATCH_DELAY_MS}ms, API delay: ${CONFIG.API_CALL_DELAY_MS}ms\n`);

  for (let i = 0; i < totalQuestions; i += CONFIG.BATCH_SIZE) {
    const batch = questions.slice(i, i + CONFIG.BATCH_SIZE);
    const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(totalQuestions / CONFIG.BATCH_SIZE);

    console.log(`\n--- Batch ${batchNum}/${totalBatches} ---`);

    for (const question of batch) {
      try {
        console.log(`[${processed + 1}/${totalQuestions}] Processing question ID: ${question.id}`);
        console.log(`  Subject: ${question.subject_name}, Level: ${question.level_name}`);
        console.log(`  Question: ${question.question_text.substring(0, 80)}...`);

        // Generate explanation
        const explanation = await withRetry(() => generateExplanation(question));

        if (explanation) {
          // Update database
          await updateExplanation(question.id, explanation);
          console.log(`  ✓ Explanation generated (${explanation.length} chars)`);
          processed++;
        } else {
          console.log(`  ✗ Empty explanation received`);
          failed++;
        }

        // Delay between API calls
        await sleep(CONFIG.API_CALL_DELAY_MS);
      } catch (error: any) {
        console.error(`  ✗ Error: ${error.message}`);
        failed++;
      }
    }

    // Delay between batches (for rate limiting)
    if (i + CONFIG.BATCH_SIZE < totalQuestions) {
      console.log(`\nWaiting ${CONFIG.BATCH_DELAY_MS / 1000}s before next batch...`);
      await sleep(CONFIG.BATCH_DELAY_MS);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total questions: ${totalQuestions}`);
  console.log(`Successfully processed: ${processed}`);
  console.log(`Failed: ${failed}`);
}

// Main function
async function main() {
  console.log('=== CFA Quiz Explanation Generator ===\n');
  console.log('Configuration:');
  console.log(`  - Min explanation length: ${CONFIG.MIN_EXPLANATION_LENGTH} chars`);
  console.log(`  - Batch size: ${CONFIG.BATCH_SIZE}`);
  console.log(`  - Batch delay: ${CONFIG.BATCH_DELAY_MS}ms`);
  console.log(`  - API call delay: ${CONFIG.API_CALL_DELAY_MS}ms`);

  try {
    // Test database connection
    console.log('\nConnecting to database...');
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully.');

    // Get questions needing explanations
    console.log('\nFetching questions needing explanations...');
    const questions = await getQuestionsNeedingExplanations();
    
    if (questions.length === 0) {
      console.log('No questions found that need explanations.');
      return;
    }

    console.log(`Found ${questions.length} questions needing explanations.`);

    // Ask for confirmation
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question('\nDo you want to proceed? (yes/no): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('Operation cancelled.');
      return;
    }

    // Process questions
    await processQuestions(questions);

  } catch (error: any) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\nDatabase connection closed.');
  }
}

// Run the script
main();
