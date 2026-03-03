require('dotenv').config();
const axios = require('axios');
const pool = require('./db');

// Token management (manual update required when expired)
const accessToken = process.env.SAPP_ACCESS_TOKEN;

// Configuration
const config = {
  baseUrl: process.env.SAPP_BASE_URL || 'https://lms-be.sapp.edu.vn/api/v1',
  mockTestUrl: 'https://mock-test-be.sapp.edu.vn/api/v1',
  courseId: process.env.SAPP_COURSE_ID || '21c502e2-6758-4860-8b9e-4f114cc5fc6b',
  delayBetweenRequests: 800,
  delayBetweenTopics: 2000,
  maxRetries: 3,
  retryDelay: 5000,
};

// Create axios instances (will update auth header dynamically)
const api = axios.create({
  baseURL: config.baseUrl,
  headers: { 'Accept': 'application/json' },
  timeout: 30000,
});

const mockTestApi = axios.create({
  baseURL: config.mockTestUrl,
  headers: { 'Accept': 'application/json' },
  timeout: 30000,
});

// Update auth headers
function updateAuthHeaders() {
  api.defaults.headers['Authorization'] = `Bearer ${accessToken}`;
  mockTestApi.defaults.headers['Authorization'] = `Bearer ${accessToken}`;
}

// Initialize auth headers
updateAuthHeaders();

// Helpers
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== Retry Logic (No Auto Token Refresh) ====================

async function withRetry(fn, retries = config.maxRetries) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const status = error.response?.status;
      
      // Handle 401 Unauthorized - token expired, user needs to update manually
      if (status === 401) {
        console.error('\n  ✗ Token expired! Please update SAPP_ACCESS_TOKEN in .env and restart.');
        process.exit(1);
      }
      
      // Handle rate limit or server error
      if ((status === 429 || status >= 500) && i < retries - 1) {
        const waitTime = config.retryDelay * Math.pow(2, i);
        console.log(`  ⏳ Rate limited/error. Waiting ${waitTime/1000}s...`);
        await delay(waitTime);
        continue;
      }
      
      if (i === retries - 1) throw error;
    }
  }
}

// ==================== API Functions ====================

async function fetchTopics() {
  console.log('\n📚 Fetching topics...');
  return withRetry(async () => {
    const response = await api.get(`/report/${config.courseId}/topic`);
    if (response.data.success) {
      console.log(`✓ Found ${response.data.data.length} topics`);
      return response.data.data;
    }
    throw new Error('Failed to fetch topics');
  });
}

async function fetchSectionTree(sectionId) {
  return withRetry(async () => {
    const response = await api.get(`/course-sections/${config.courseId}`, {
      params: { course_section_id: sectionId }
    });
    if (response.data.success) {
      return response.data.data.course_section_tree || [];
    }
    return [];
  });
}

async function fetchActivityTabs(activityId) {
  return withRetry(async () => {
    const response = await api.get(`/course-sections/activity/${activityId}/tabs`);
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  });
}

async function fetchTabDetails(tabId) {
  return withRetry(async () => {
    const response = await api.get(`/course-sections/${config.courseId}/tab/${tabId}`);
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  });
}

async function fetchQuestionFromMockTest(questionId) {
  return withRetry(async () => {
    const response = await mockTestApi.get(`/question/${questionId}`);
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  });
}

// ==================== Database Functions ====================

function mapTopicToSubjectCode(topicName) {
  const mapping = {
    'Quantitative Methods': 'QUANT',
    'Economics': 'ECON',
    'Financial Statement Analysis': 'FSA',
    'Corporate Issuers': 'CORP',
    'Equity': 'EQUITY',
    'Fixed Income': 'FIXED',
    'Derivatives': 'DERIV',
    'Alternative Investments': 'ALT',
    'Portfolio Management': 'PM',
    'Ethical And Professional Standards': 'ETHICS',
  };
  
  for (const [key, code] of Object.entries(mapping)) {
    if (topicName.toLowerCase().includes(key.toLowerCase())) {
      return code;
    }
  }
  return null;
}

async function getSubjectId(subjectCode) {
  const result = await pool.query('SELECT id FROM subjects WHERE code = $1', [subjectCode]);
  return result.rows[0]?.id;
}

async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE questions 
      ADD COLUMN IF NOT EXISTS external_id VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS module_id INTEGER REFERENCES modules(id),
      ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50),
      ADD COLUMN IF NOT EXISTS question_key VARCHAR(50)
    `);
    await client.query(`
      ALTER TABLE answers 
      ADD COLUMN IF NOT EXISTS external_id VARCHAR(255)
    `);
    console.log('✓ Schema ready');
  } catch (error) {
    // Columns might already exist
  } finally {
    client.release();
  }
}

async function saveQuestion(question, subjectId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const existing = await client.query(
      'SELECT id FROM questions WHERE external_id = $1',
      [question.id]
    );
    
    let questionId;
    
    if (existing.rows.length > 0) {
      questionId = existing.rows[0].id;
      await client.query(`
        UPDATE questions SET
          question_text = $1,
          question_type = $2,
          difficulty = $3,
          question_key = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [
        question.question_content,
        question.qType,
        question.level,
        question.key,
        questionId
      ]);
    } else {
      const result = await client.query(`
        INSERT INTO questions (subject_id, external_id, question_text, question_type, difficulty, question_key)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        subjectId,
        question.id,
        question.question_content,
        question.qType,
        question.level,
        question.key
      ]);
      questionId = result.rows[0].id;
    }
    
    await client.query('DELETE FROM answers WHERE question_id = $1', [questionId]);
    
    if (question.answers && question.answers.length > 0) {
      for (const answer of question.answers) {
        await client.query(`
          INSERT INTO answers (question_id, answer_text, is_correct, order_index, external_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          questionId,
          answer.answer,
          answer.is_correct || false,
          answer.answer_position || 0,
          answer.id
        ]);
      }
    }
    
    await client.query('COMMIT');
    return { saved: true, questionId };
  } catch (error) {
    await client.query('ROLLBACK');
    return { saved: false, error: error.message };
  } finally {
    client.release();
  }
}

// ==================== Main Crawler ====================

async function processTopic(topic, index, total) {
  console.log(`\n[${index + 1}/${total}] 📖 ${topic.name}`);
  
  const subjectCode = mapTopicToSubjectCode(topic.name);
  if (!subjectCode) {
    console.log('  ⚠ Skipping (no subject match)');
    return { questions: 0 };
  }
  
  const subjectId = await getSubjectId(subjectCode);
  if (!subjectId) {
    console.log(`  ⚠ Subject not found: ${subjectCode}`);
    return { questions: 0 };
  }
  
  let totalQuestions = 0;
  const processedQuestionIds = new Set();
  
  // Step 1: Get topic sections (returns CHAPTERs)
  const topicSections = await fetchSectionTree(topic.id);
  await delay(config.delayBetweenRequests);
  
  const chapters = topicSections.filter(s => s.course_section_type === 'CHAPTER');
  console.log(`  → Found ${chapters.length} chapters`);
  
  // Step 2: For each chapter, get its nested structure
  for (const chapter of chapters) {
    console.log(`    📁 ${chapter.name.substring(0, 50)}...`);
    
    const chapterSections = await fetchSectionTree(chapter.id);
    await delay(config.delayBetweenRequests);
    
    const activities = chapterSections.filter(s => s.course_section_type === 'ACTIVITY');
    
    // Step 3: For each activity, get tabs
    for (const activity of activities) {
      try {
        const tabs = await fetchActivityTabs(activity.id);
        await delay(config.delayBetweenRequests);
        
        // Step 4: For each tab, get details and questions
        for (const tab of tabs) {
          try {
            const tabDetails = await fetchTabDetails(tab.id);
            await delay(config.delayBetweenRequests);
            
            if (!tabDetails?.course_tab_documents) continue;
            
            // Step 5: Find quizzes and extract question IDs
            for (const doc of tabDetails.course_tab_documents) {
              if (doc.type !== 'QUIZ' || !doc.quiz?.quiz_question_instances) continue;
              
              const questionIds = doc.quiz.quiz_question_instances.map(q => q.question_id);
              
              // Step 6: Fetch and save each question
              for (const questionId of questionIds) {
                if (processedQuestionIds.has(questionId)) continue;
                processedQuestionIds.add(questionId);
                
                try {
                  const questionData = await fetchQuestionFromMockTest(questionId);
                  await delay(config.delayBetweenRequests);
                  
                  if (questionData) {
                    const result = await saveQuestion(questionData, subjectId);
                    if (result.saved) {
                      totalQuestions++;
                      process.stdout.write(`\r    → Saved ${totalQuestions} questions...`);
                    }
                  }
                } catch (err) {
                  // Continue on error
                }
              }
            }
          } catch (err) {
            // Continue on error
          }
        }
      } catch (err) {
        // Continue on error
      }
    }
  }
  
  console.log(`\n  ✓ Saved ${totalQuestions} questions for ${subjectCode}`);
  return { questions: totalQuestions };
}

async function crawl(startFromTopic = 0) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SAPP LMS Crawler - CFA Quiz Import v2.4 (Manual Token)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Course ID: ${config.courseId}`);
  console.log(`Delay: ${config.delayBetweenRequests}ms between requests`);
  if (startFromTopic > 0) {
    console.log(`🔄 Resuming from Topic ${startFromTopic + 1}`);
  }
  
  if (!accessToken) {
    console.error('\n✗ ERROR: SAPP_ACCESS_TOKEN not set!');
    process.exit(1);
  }
  
  try {
    await ensureSchema();
    
    const topics = await fetchTopics();
    const contentTopics = topics.filter(t => 
      t.name.startsWith('Topic ') && !t.name.includes('Orientation')
    );
    
    console.log(`\n📋 Total topics: ${contentTopics.length}`);
    console.log(`📋 Starting from topic ${startFromTopic + 1}...\n`);
    
    let totalQuestions = 0;
    
    // Start from specified topic index
    for (let i = startFromTopic; i < contentTopics.length; i++) {
      const result = await processTopic(contentTopics[i], i, contentTopics.length);
      totalQuestions += result.questions;
      await delay(config.delayBetweenTopics);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  CRAWL COMPLETED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✓ Total questions saved in this run: ${totalQuestions}`);
    
  } catch (error) {
    console.error('\n✗ Crawl failed:', error.message);
  } finally {
    await pool.end();
    console.log('✓ Database connection closed');
  }
}

// Parse command line arguments
// Usage: node crawler.js [startTopicIndex]
// Example: node crawler.js 7  (starts from Topic 8, 0-indexed)
const args = process.argv.slice(2);
const startTopic = args[0] ? parseInt(args[0]) : 0;

console.log('\n📌 Usage: node crawler.js [startTopicIndex]');
console.log('   Example: node crawler.js 7  → starts from Topic 8\n');

crawl(startTopic);
