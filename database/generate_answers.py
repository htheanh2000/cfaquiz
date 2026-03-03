#!/usr/bin/env python3
"""
Generate answer SQL for all questions in seed_questions.sql
Each question gets 4 answers: 1 correct, 3 incorrect
"""

import re

# Read the questions SQL file
with open('seed_questions.sql', 'r') as f:
    content = f.read()

# Extract all INSERT statements for questions
question_pattern = r"INSERT INTO questions \(subject_id, level_id, question_text, explanation\) VALUES\s*\((\d+),\s*(\d+),\s*'([^']+)',\s*'([^']+)'\);"

questions = re.findall(question_pattern, content)

# Generate answers SQL
answers_sql = []
question_counter = {}

for subject_id, level_id, question_text, explanation in questions:
    subject_id = int(subject_id)
    level_id = int(level_id)
    
    # Count questions per subject/level
    key = (subject_id, level_id)
    question_counter[key] = question_counter.get(key, 0)
    offset = question_counter[key]
    question_counter[key] += 1
    
    # Generate 4 answers per question
    # Answer 1 is correct, answers 2-4 are incorrect
    correct_answer = f"Correct answer based on: {explanation[:50]}..."
    incorrect_answers = [
        "This is incorrect and does not align with the principles.",
        "This statement is false and contradicts best practices.",
        "This option is not accurate and should be avoided."
    ]
    
    # Build the SELECT query to get question ID
    select_query = f"(SELECT id FROM questions WHERE subject_id = {subject_id} AND level_id = {level_id} ORDER BY id LIMIT 1 OFFSET {offset})"
    
    # Insert correct answer
    answers_sql.append(f"INSERT INTO answers (question_id, answer_text, is_correct, order_index) VALUES ({select_query}, '{correct_answer}', true, 1);")
    
    # Insert incorrect answers
    for i, incorrect in enumerate(incorrect_answers, start=2):
        answers_sql.append(f"INSERT INTO answers (question_id, answer_text, is_correct, order_index) VALUES ({select_query}, '{incorrect}', false, {i});")

# Write to file
with open('seed_answers.sql', 'w') as f:
    f.write('-- Generated Answers for All Questions\n')
    f.write('-- Each question has 4 answers: 1 correct, 3 incorrect\n\n')
    f.write('\n'.join(answers_sql))

print(f"Generated {len(answers_sql)} answer INSERT statements for {len(questions)} questions")
