import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, apiResponse, apiError, unauthorized } from '@/lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUser(req);
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get wrong answers grouped by subject and error type
    // For now, we'll categorize errors based on question characteristics
    const pitfallsResult = await pool.query(
      `SELECT 
        s.id as subject_id,
        s.name as subject_name,
        COUNT(wa.id) as error_count,
        COUNT(DISTINCT wa.question_id) as unique_errors,
        MAX(wa.times_wrong) as max_times_wrong
      FROM wrong_answers wa
      INNER JOIN questions q ON wa.question_id = q.id
      INNER JOIN subjects s ON q.subject_id = s.id
      WHERE wa.user_id = $1 
        AND wa.last_wrong_at >= CURRENT_DATE - INTERVAL '${days} days'
        AND wa.reviewed_at IS NULL
      GROUP BY s.id, s.name
      ORDER BY error_count DESC
      LIMIT 10`,
      [userId]
    );

    // Map subject names to error types based on common pitfalls
    const subjectErrorTypes: { [key: string]: { name: string; icon: string } } = {
      'Quantitative Methods': { name: 'Calculation / Rounding', icon: 'calculator' },
      'Derivatives': { name: 'Calculation / Rounding', icon: 'calculator' },
      'Fixed Income': { name: 'Time Pressure Error', icon: 'clock' },
      'Equity Investments': { name: 'Conceptual Gap', icon: 'lightbulb' },
      'Ethical and Professional Standards': { name: 'Reading Misinterpretation', icon: 'book' },
      'Financial Statement Analysis': { name: 'Calculation / Rounding', icon: 'calculator' },
      'Economics': { name: 'Conceptual Gap', icon: 'lightbulb' },
      'Corporate Issuers': { name: 'Conceptual Gap', icon: 'lightbulb' },
      'Alternative Investments': { name: 'Conceptual Gap', icon: 'lightbulb' },
      'Portfolio Management': { name: 'Time Pressure Error', icon: 'clock' },
    };

    const pitfalls = pitfallsResult.rows.map((row: any) => {
      const errorType = subjectErrorTypes[row.subject_name] || { name: 'Conceptual Gap', icon: 'lightbulb' };
      
      // Calculate impact (percentage of total errors)
      const totalErrors = pitfallsResult.rows.reduce((sum: number, r: any) => sum + parseInt(r.error_count), 0);
      const impact = totalErrors > 0 ? (parseInt(row.error_count) / totalErrors) * 100 : 0;

      return {
        subjectId: row.subject_id,
        subjectName: row.subject_name,
        subCategory: getSubCategory(row.subject_name),
        errorType: errorType.name,
        errorIcon: errorType.icon,
        frequency: parseInt(row.error_count),
        impact: parseFloat(impact.toFixed(0)),
      };
    });

    return apiResponse({ pitfalls });
  } catch (error) {
    console.error('Get pitfalls error:', error);
    return apiError('Internal server error', 500);
  }
}

function getSubCategory(subjectName: string | null): string {
  if (!subjectName) return 'GENERAL';
  
  const categories: { [key: string]: string } = {
    'Derivatives': 'VALUATION & PRICING',
    'Equity Investments': 'VALUATION MODELS',
    'Ethical and Professional Standards': 'PROFESSIONAL STANDARDS',
    'Fixed Income': 'YIELD MEASURES',
    'Quantitative Methods': 'STATISTICAL ANALYSIS',
    'Economics': 'MACROECONOMICS',
    'Financial Statement Analysis': 'FINANCIAL RATIOS',
    'Corporate Issuers': 'CORPORATE GOVERNANCE',
    'Alternative Investments': 'INVESTMENT STRATEGIES',
    'Portfolio Management': 'RISK MANAGEMENT',
  };

  return categories[subjectName] || 'GENERAL';
}
