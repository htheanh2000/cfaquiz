-- Junction table for linking questions to modules
CREATE TABLE IF NOT EXISTS question_modules (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, module_id)
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_question_modules_question ON question_modules(question_id);
CREATE INDEX IF NOT EXISTS idx_question_modules_module ON question_modules(module_id);
