#!/bin/bash
# Load seed data into PostgreSQL database

set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_NAME="${DB_NAME:-cfaquiz}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

echo "Loading seed data into database: $DB_NAME"

# Export password for psql
export PGPASSWORD="$DB_PASSWORD"

# Load schema first (if not already loaded)
echo "Loading schema..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f schema.sql

# Load questions
echo "Loading questions..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f seed_questions.sql

# Load answers
echo "Loading answers..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f seed_answers_complete.sql

echo "Seed data loaded successfully!"
echo ""
echo "Summary:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) as total_questions FROM questions;"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) as total_answers FROM answers;"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT subject_id, level_id, COUNT(*) as question_count FROM questions GROUP BY subject_id, level_id ORDER BY subject_id, level_id;"
