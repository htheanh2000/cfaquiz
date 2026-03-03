/**
 * Script to generate AI explanations for CFA quiz questions
 * Handles Neon DB rate limits with batch processing and delays
 * 
 * Usage: 
 *   cd scripts
 *   node generate-explanations.js
 * 
 * Environment variables (create .env file in scripts folder):
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 *   OPENAI_API_KEY
 */

require('dotenv').config();
const { Pool } = require('pg');
const OpenAI = require('openai');

// ============ CONFIGURATION ============
const CONFIG = {
  // Batch size for processing questions
  BATCH_SIZE: 5,
  // Delay between batches (ms) - to handle Neon rate limits
  BATCH_DELAY_MS: 3000,
  // Delay between individual API calls (ms)
  API_CALL_DELAY_MS: 1000,
  // Only process questions with explanation shorter than this (set to 0 to process all NULL)
  MIN_EXPLANATION_LENGTH: 100,
  // Max retries for failed operations
  MAX_RETRIES: 3,
  // Retry delay (ms)
  RETRY_DELAY_MS: 5000,
  // Limit number of questions to process (set to 0 for no limit)
  LIMIT: process.env.LIMIT ? parseInt(process.env.LIMIT) : 0,
  // Skip confirmation prompt
  SKIP_CONFIRM: process.env.SKIP_CONFIRM === 'true',
};

// ============ INITIALIZE CLIENTS ============
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const dbHost = process.env.DB_HOST || 'localhost';
const isNeon = dbHost.includes('neon.tech');

const pool = new Pool({
  host: dbHost,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cfaquiz',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 3, // Lower pool size for rate limiting
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: isNeon ? { rejectUnauthorized: false } : false,
});

// ============ UTILITIES ============
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry(fn, retries = CONFIG.MAX_RETRIES, delay = CONFIG.RETRY_DELAY_MS) {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`  ⏳ Retrying in ${delay / 1000}s... (${retries} retries left)`);
      await sleep(delay);
      return withRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

// ============ DATABASE FUNCTIONS ============
async function getQuestionsNeedingExplanations() {
  let query = `
    SELECT 
      q.id,
      q.question_text,
      q.explanation,
      s.name as subject_name,
      s.code as subject_code,
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
       OR LENGTH(TRIM(q.explanation)) < $1
    GROUP BY q.id, q.question_text, q.explanation, s.name, s.code, l.name
    ORDER BY q.id
  `;

  if (CONFIG.LIMIT > 0) {
    query += ` LIMIT ${CONFIG.LIMIT}`;
  }

  const result = await pool.query(query, [CONFIG.MIN_EXPLANATION_LENGTH]);
  return result.rows;
}

async function updateExplanation(questionId, explanation) {
  await withRetry(async () => {
    await pool.query(
      'UPDATE questions SET explanation = $1, updated_at = NOW() WHERE id = $2',
      [explanation, questionId]
    );
  });
}

// ============ AI FUNCTION ============
async function generateExplanation(question) {
  const answers = typeof question.answers === 'string' 
    ? JSON.parse(question.answers) 
    : question.answers;

  const prompt = `You are a CFA exam tutor. Generate a detailed, educational explanation for the following CFA exam question.

Subject: ${question.subject_name || 'CFA'}
Level: ${question.level_name || 'Unknown'}

Question: ${question.question_text}

Answer Options:
${answers.map((a, i) => `${String.fromCharCode(65 + i)}. ${a.answer_text}${a.is_correct ? ' ✓ (Correct)' : ''}`).join('\n')}

Please provide a comprehensive explanation that includes:
1. Why the correct answer is right
2. Why each incorrect option is wrong
3. Key concepts, formulas, or frameworks relevant to this question
4. Tips for recognizing similar questions on the CFA exam

Keep the explanation educational and concise (250-400 words). Use clear language suitable for CFA candidates.

For mathematical expressions, use LaTeX:
- Inline math: $formula$
- Block equations: $$formula$$`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert CFA exam tutor. Provide clear, accurate, and educational explanations that help students understand concepts deeply.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

// ============ MAIN PROCESSING ============
async function processQuestions(questions) {
  const totalQuestions = questions.length;
  let processed = 0;
  let failed = 0;

  console.log(`\n📚 Processing ${totalQuestions} questions in batches of ${CONFIG.BATCH_SIZE}...`);
  console.log(`⏱️  Batch delay: ${CONFIG.BATCH_DELAY_MS}ms, API delay: ${CONFIG.API_CALL_DELAY_MS}ms\n`);

  for (let i = 0; i < totalQuestions; i += CONFIG.BATCH_SIZE) {
    const batch = questions.slice(i, i + CONFIG.BATCH_SIZE);
    const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(totalQuestions / CONFIG.BATCH_SIZE);

    console.log(`\n━━━ Batch ${batchNum}/${totalBatches} ━━━`);

    for (const question of batch) {
      try {
        const progress = `[${processed + failed + 1}/${totalQuestions}]`;
        console.log(`\n${progress} Question ID: ${question.id}`);
        console.log(`   📖 ${question.subject_name} | ${question.level_name}`);
        console.log(`   ❓ ${question.question_text.substring(0, 70)}...`);

        // Generate explanation
        const explanation = await withRetry(() => generateExplanation(question));

        if (explanation && explanation.length > 50) {
          // Update database
          await updateExplanation(question.id, explanation);
          console.log(`   ✅ Generated (${explanation.length} chars)`);
          processed++;
        } else {
          console.log(`   ❌ Empty or too short explanation`);
          failed++;
        }

        // Delay between API calls
        await sleep(CONFIG.API_CALL_DELAY_MS);
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        failed++;
      }
    }

    // Delay between batches (for Neon rate limiting)
    if (i + CONFIG.BATCH_SIZE < totalQuestions) {
      console.log(`\n⏳ Waiting ${CONFIG.BATCH_DELAY_MS / 1000}s before next batch (rate limit)...`);
      await sleep(CONFIG.BATCH_DELAY_MS);
    }
  }

  return { processed, failed };
}

// ============ MAIN ============
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   CFA Quiz - AI Explanation Generator      ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log('📋 Configuration:');
  console.log(`   • Min explanation length: ${CONFIG.MIN_EXPLANATION_LENGTH} chars`);
  console.log(`   • Batch size: ${CONFIG.BATCH_SIZE}`);
  console.log(`   • Batch delay: ${CONFIG.BATCH_DELAY_MS}ms`);
  console.log(`   • API call delay: ${CONFIG.API_CALL_DELAY_MS}ms`);
  console.log(`   • Limit: ${CONFIG.LIMIT || 'No limit'}`);
  console.log(`   • Database: ${isNeon ? 'Neon (cloud)' : 'Local'}`);

  try {
    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    // Test database connection
    console.log('\n🔌 Connecting to database...');
    const dbTest = await pool.query('SELECT NOW() as time, COUNT(*) as total_questions FROM questions');
    console.log(`   ✅ Connected! Total questions in DB: ${dbTest.rows[0].total_questions}`);

    // Get questions needing explanations
    console.log('\n🔍 Finding questions without explanations...');
    const questions = await getQuestionsNeedingExplanations();
    
    if (questions.length === 0) {
      console.log('   ✅ All questions already have explanations!');
      return;
    }

    console.log(`   📝 Found ${questions.length} questions needing explanations`);

    // Show sample
    console.log('\n📌 Sample questions to process:');
    questions.slice(0, 3).forEach((q, i) => {
      console.log(`   ${i + 1}. [ID:${q.id}] ${q.question_text.substring(0, 60)}...`);
    });

    // Confirmation
    if (!CONFIG.SKIP_CONFIRM) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise((resolve) => {
        rl.question('\n▶️  Proceed with generation? (yes/no): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('\n❌ Operation cancelled.');
        return;
      }
    } else {
      console.log('\n▶️  Auto-confirmed (SKIP_CONFIRM=true)');
    }

    // Process
    const startTime = Date.now();
    const { processed, failed } = await processQuestions(questions);
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

    // Summary
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║               📊 SUMMARY                   ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║  Total questions:     ${String(questions.length).padStart(6)}              ║`);
    console.log(`║  Successfully done:   ${String(processed).padStart(6)} ✅            ║`);
    console.log(`║  Failed:              ${String(failed).padStart(6)} ❌            ║`);
    console.log(`║  Duration:            ${String(duration + ' min').padStart(10)}          ║`);
    console.log('╚════════════════════════════════════════════╝');

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run
main();
