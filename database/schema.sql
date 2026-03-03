-- CFA Quiz Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    exam_date DATE,
    daily_goal INTEGER DEFAULT 50,
    email_notifications BOOLEAN DEFAULT TRUE,
    weekly_reports BOOLEAN DEFAULT TRUE,
    level_preference VARCHAR(50) DEFAULT 'Level I',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table (10 môn học)
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Levels table
CREATE TABLE IF NOT EXISTS levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    order_index INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    level_id INTEGER REFERENCES levels(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'multiple_choice',
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Answers table (options for each question)
CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    level_id INTEGER REFERENCES levels(id) ON DELETE SET NULL,
    quiz_type VARCHAR(50) DEFAULT 'random', -- 'random', 'subject', 'level', 'wrong_answers'
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    score DECIMAL(5,2) DEFAULT 0,
    time_taken INTEGER DEFAULT 0, -- seconds
    time_limit INTEGER DEFAULT NULL, -- minutes
    show_hints BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz answers table (user's answers for each quiz session)
CREATE TABLE IF NOT EXISTS quiz_answers (
    id SERIAL PRIMARY KEY,
    quiz_session_id INTEGER REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    answer_id INTEGER REFERENCES answers(id) ON DELETE SET NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    time_taken INTEGER DEFAULT 0, -- seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wrong answers table (tracking wrong answers for review)
CREATE TABLE IF NOT EXISTS wrong_answers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    times_wrong INTEGER DEFAULT 1,
    last_wrong_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, question_id)
);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Reminders table (for wrong answers review)
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    remind_at TIMESTAMP NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance tracking table
CREATE TABLE IF NOT EXISTS performance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
    level_id INTEGER REFERENCES levels(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    total_quizzes INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- seconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, subject_id, level_id, date)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_subject_level ON questions(subject_id, level_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created ON quiz_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session ON quiz_answers(quiz_session_id);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_user ON wrong_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_wrong_answers_last_wrong ON wrong_answers(last_wrong_at);
CREATE INDEX IF NOT EXISTS idx_reminders_user_remind ON reminders(user_id, remind_at);
CREATE INDEX IF NOT EXISTS idx_performance_user_date ON performance(user_id, date);

-- Insert default subjects (10 môn CFA)
INSERT INTO subjects (name, code, description) VALUES
('Ethical and Professional Standards', 'ETHICS', 'Ethical standards and professional conduct'),
('Quantitative Methods', 'QUANT', 'Quantitative analysis and statistics'),
('Economics', 'ECON', 'Microeconomics and macroeconomics'),
('Financial Statement Analysis', 'FSA', 'Financial reporting and analysis'),
('Corporate Issuers', 'CORP', 'Corporate finance and governance'),
('Equity Investments', 'EQUITY', 'Equity markets and valuation'),
('Fixed Income', 'FIXED', 'Fixed income securities and markets'),
('Derivatives', 'DERIV', 'Derivatives markets and valuation'),
('Alternative Investments', 'ALT', 'Alternative investment strategies'),
('Portfolio Management', 'PM', 'Portfolio management and wealth planning')
ON CONFLICT (code) DO NOTHING;

-- Insert default levels
INSERT INTO levels (name, order_index, description) VALUES
('Level 1', 1, 'Fundamental level'),
('Level 2', 2, 'Intermediate level'),
('Level 3', 3, 'Advanced level')
ON CONFLICT DO NOTHING;
