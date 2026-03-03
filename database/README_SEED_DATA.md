# Seed Data for CFA Quiz

## Overview
This directory contains seed data for the CFA Quiz application with 200 questions across 10 subjects and 3 difficulty levels.

## Structure

### Files
- `schema.sql` - Database schema with tables and initial data (10 subjects, 3 levels)
- `seed_questions.sql` - 200 questions (20 per subject)
- `seed_answers_complete.sql` - Answers for all questions (4 answers per question)
- `load_seed_data.sh` - Script to load all seed data into the database
- `generate_all_answers.py` - Python script to generate answer SQL

## Data Distribution

### Subjects (10 total)
1. Ethical and Professional Standards (ETHICS)
2. Quantitative Methods (QUANT)
3. Economics (ECON)
4. Financial Statement Analysis (FSA)
5. Corporate Issuers (CORP)
6. Equity Investments (EQUITY)
7. Fixed Income (FIXED)
8. Derivatives (DERIV)
9. Alternative Investments (ALT)
10. Portfolio Management (PM)

### Difficulty Levels (3 total)
- **Level 1 (Easy)**: 7 questions per subject = 70 questions total
- **Level 2 (Medium)**: 7 questions per subject = 70 questions total
- **Level 3 (Hard)**: 6 questions per subject = 60 questions total

### Total
- **200 questions** (20 per subject)
- **800 answers** (4 answers per question: 1 correct, 3 incorrect)

## Loading Seed Data

### Option 1: Using Docker Compose
```bash
cd /Users/sophie/Desktop/Code/contabo/srv/cfaquiz

# Load questions
docker compose exec -T db psql -U postgres -d cfaquiz -f - < database/seed_questions.sql

# Load answers
docker compose exec -T db psql -U postgres -d cfaquiz -f - < database/seed_answers_complete.sql
```

### Option 2: Using the load script
```bash
cd /Users/sophie/Desktop/Code/contabo/srv/cfaquiz/database
./load_seed_data.sh
```

### Option 3: Direct PostgreSQL
```bash
psql -h localhost -p 5433 -U postgres -d cfaquiz -f seed_questions.sql
psql -h localhost -p 5433 -U postgres -d cfaquiz -f seed_answers_complete.sql
```

## Verifying Data

Check that data was loaded correctly:
```sql
-- Count questions
SELECT COUNT(*) FROM questions;  -- Should return 200

-- Count answers
SELECT COUNT(*) FROM answers;  -- Should return 800

-- Questions per subject and level
SELECT s.name as subject, l.name as level, COUNT(q.id) as questions
FROM questions q
JOIN subjects s ON q.subject_id = s.id
JOIN levels l ON q.level_id = l.id
GROUP BY s.name, l.name, s.id, l.id
ORDER BY s.id, l.id;

-- Answers per question (should be 4 for each)
SELECT question_id, COUNT(*) as answer_count
FROM answers
GROUP BY question_id
HAVING COUNT(*) != 4;
```

## Notes

- Questions are distributed evenly across difficulty levels within each subject
- Each question has exactly 4 answers (1 correct, 3 incorrect)
- Answers are ordered by `order_index` (1-4)
- The correct answer is always at `order_index = 1`
- Question explanations are included in the `explanation` field

## Customization

To add more questions or modify existing ones:
1. Edit `seed_questions.sql` to add/modify questions
2. Run `generate_all_answers.py` to regenerate answers (or manually update `seed_answers_complete.sql`)
3. Reload the data using one of the methods above
