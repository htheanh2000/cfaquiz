-- Modules table for curriculum management
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
    module_code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    estimated_time INTEGER DEFAULT 0, -- minutes
    status VARCHAR(20) DEFAULT 'draft', -- 'draft' or 'published'
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_modules_subject ON modules(subject_id);
CREATE INDEX IF NOT EXISTS idx_modules_status ON modules(status);
