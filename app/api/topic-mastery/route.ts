import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

// CFA Curriculum standard order
const TOPIC_ORDER: Record<string, number> = {
  'ETHICS': 1,
  'QUANT': 2,
  'ECON': 3,
  'FSA': 4,
  'CORP': 5,
  'EQUITY': 6,
  'FIXED': 7,
  'DERIV': 8,
  'ALT': 9,
  'PM': 10,
};

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    // Get all subjects with their question counts
    const subjectsResult = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.code,
        s.description,
        COUNT(q.id) as total_questions
      FROM subjects s
      LEFT JOIN questions q ON q.subject_id = s.id
      GROUP BY s.id, s.name, s.code, s.description
      ORDER BY s.id
    `);
    const subjects = subjectsResult.rows;

    // Get topic mastery for each subject based on last 100 answers
    const masteryPromises = subjects.map(async (subject: any) => {
      const totalQuestions = parseInt(subject.total_questions || '0');

      // Get last 100 answers for this subject
      const recentAnswersResult = await pool.query(
        `SELECT 
          qa.is_correct
        FROM quiz_answers qa
        JOIN quiz_sessions qs ON qa.quiz_session_id = qs.id
        JOIN questions q ON qa.question_id = q.id
        WHERE qs.user_id = $1 AND q.subject_id = $2
        ORDER BY qa.created_at DESC
        LIMIT 100`,
        [userId, subject.id]
      );

      const recentAnswers = recentAnswersResult.rows;
      const totalAnswered = recentAnswers.length;
      const totalCorrect = recentAnswers.filter((a: any) => a.is_correct).length;

      // Calculate mastery percentage based on last 100 answers
      let mastery = 0;
      if (totalAnswered > 0) {
        mastery = Math.round((totalCorrect / totalAnswered) * 100);
      }

      // Get total questions answered (all time) for progress calculation
      const allTimeResult = await pool.query(
        `SELECT COUNT(*) as total
        FROM quiz_answers qa
        JOIN quiz_sessions qs ON qa.quiz_session_id = qs.id
        JOIN questions q ON qa.question_id = q.id
        WHERE qs.user_id = $1 AND q.subject_id = $2`,
        [userId, subject.id]
      );
      const allTimeAnswered = parseInt(allTimeResult.rows[0]?.total || '0');

      // Calculate progress (how many questions have been attempted out of total)
      const progress = totalQuestions > 0 
        ? Math.round((allTimeAnswered / totalQuestions) * 100)
        : 0;

      // Determine status based on mastery
      let status = 'not_started';
      if (totalAnswered > 0) {
        if (mastery >= 80) {
          status = 'mastered';
        } else if (mastery >= 60) {
          status = 'developing';
        } else {
          status = 'critical';
        }
      }

      // Get order index from TOPIC_ORDER, default to 99 if not found
      const orderIndex = TOPIC_ORDER[subject.code] || 99;

      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        orderIndex,
        mastery: isNaN(mastery) ? 0 : mastery,
        progress,
        questionsAnswered: totalAnswered, // Last 100 answers count
        questionsCorrect: totalCorrect,
        allTimeAnswered, // Total answers all time
        questions: totalCorrect, // For backward compatibility
        total: totalQuestions,
        status,
        color: status === 'mastered' ? 'emerald' : 
               status === 'critical' ? 'red' : 
               status === 'developing' ? 'amber' : 'slate',
      };
    });

    const topics = await Promise.all(masteryPromises);

    // Sort by CFA curriculum order, filter out topics without questions
    const sortedTopics = topics
      .filter(t => t.total > 0)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    // Calculate summary stats
    const summary = {
      totalTopics: sortedTopics.length,
      totalQuestions: sortedTopics.reduce((sum, t) => sum + t.total, 0),
      totalAnswered: sortedTopics.reduce((sum, t) => sum + t.allTimeAnswered, 0),
      overallMastery: sortedTopics.length > 0
        ? Math.round(sortedTopics.reduce((sum, t) => sum + t.mastery, 0) / sortedTopics.length)
        : 0,
    };

    return apiResponse({ topics: sortedTopics, summary });
  } catch (error) {
    console.error('Get topic mastery error:', error);
    return apiError('Internal server error', 500);
  }
}
