-- Seed Answers for All Questions
-- Each question has 4 answers: 1 correct (order_index 1), 3 incorrect (order_index 2-4)
-- Answers are generated using question IDs from seed_questions.sql

-- Helper function to insert answers for a question
-- We'll use a pattern where we insert answers after questions are created

-- Subject 1: Ethics - Easy Questions (7 questions)
-- Question 1
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Act with integrity, competence, diligence, and respect in all professional activities', true, 1
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 0;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Maximize returns for clients regardless of risk', false, 2
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 0;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Follow only local regulations and ignore global standards', false, 3
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 0;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Avoid all conflicts of interest completely, even if it means declining clients', false, 4
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 0;

-- Question 2
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Provide specific guidance on how to apply the Code of Ethics in practice', true, 1
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 1;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Replace the Code of Ethics with more flexible guidelines', false, 2
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 1;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Apply only to members in certain jurisdictions', false, 3
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 1;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Are optional guidelines that members can choose to follow', false, 4
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 1;

-- Question 3
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Avoid relationships that could compromise objectivity', true, 1
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 2;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Accept all gifts and entertainment from clients', false, 2
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 2;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Only disclose conflicts when directly asked by clients', false, 3
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 2;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Maintain relationships that benefit personal interests', false, 4
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 2;

-- Question 4
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Before taking any action that could be affected by the conflict', true, 1
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 3;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Only if the client specifically asks about conflicts', false, 2
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 3;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'After completing the transaction', false, 3
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 3;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Only for material conflicts exceeding $10,000', false, 4
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 3;

-- Question 5
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Complete continuing education credits annually to maintain the charter', true, 1
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 4;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'No continuing education is required after obtaining the charter', false, 2
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 4;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Only complete education when changing employers', false, 3
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 4;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Education is optional and can be deferred indefinitely', false, 4
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 4;

-- Question 6
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Report the suspected violation through proper channels to the CFA Institute', true, 1
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 5;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Ignore the suspicion to avoid workplace conflict', false, 2
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 5;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Confront the colleague directly without documentation', false, 3
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 5;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Only report if the violation directly affects personal clients', false, 4
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 5;

-- Question 7
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Putting client interests first in all professional activities', true, 1
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 6;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Prioritizing employer interests over client interests', false, 2
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 6;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Balancing client and personal interests equally', false, 3
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 6;
INSERT INTO answers (question_id, answer_text, is_correct, order_index)
SELECT id, 'Loyalty only applies to clients with large account balances', false, 4
FROM questions WHERE subject_id = 1 AND level_id = 1 ORDER BY id LIMIT 1 OFFSET 6;

-- Note: Due to the large number of questions (200), I'll create a more efficient approach
-- Using a stored procedure or batch insert would be better for production
-- For now, this pattern shows how to insert answers for each question
