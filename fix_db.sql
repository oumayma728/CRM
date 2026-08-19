CREATE DATABASE IF NOT EXISTS pfe_crm_ia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pfe_crm_ia;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'agent',
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120),
    first_call DATETIME,
    last_call DATETIME,
    total_calls INT DEFAULT 0,
    role ENUM('admin', 'agent') DEFAULT 'agent',
    team_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id VARCHAR(50) NOT NULL,
    agent_name VARCHAR(100),
    audio_file VARCHAR(255),
    transcription TEXT,
    labeled_transcript TEXT,
    agent_text TEXT,
    client_text TEXT,
    diarization_method VARCHAR(20) DEFAULT 'none',
    agent_talk_ratio FLOAT DEFAULT 0,
    client_talk_ratio FLOAT DEFAULT 0,
    agent_seconds FLOAT DEFAULT 0,
    client_seconds FLOAT DEFAULT 0,
    sentiment VARCHAR(20),
    sentiment_score FLOAT DEFAULT 0.5,
    score_percentage FLOAT DEFAULT 0,
    performance VARCHAR(50),
    summary TEXT,
    keywords JSON,
    call_type VARCHAR(50),
    problem VARCHAR(200),
    postal_code VARCHAR(10),
    customer_intent VARCHAR(100),
    script_respected TINYINT(1) DEFAULT 0,
    objections_handled TINYINT(1) DEFAULT 0,
    agent_politeness INT DEFAULT 5,
    score_ecoute INT DEFAULT 0,
    score_persuasion INT DEFAULT 0,
    score_empathie INT DEFAULT 0,
    score_argumentation INT DEFAULT 0,
    score_refus INT DEFAULT 0,
    score_vente INT DEFAULT 0,
    next_steps TEXT,
    appointment_date VARCHAR(100),
    appointment_confidence INT DEFAULT 0,
    inactivity_detected TINYINT(1) DEFAULT 0,
    inactivity_duration FLOAT DEFAULT 0,
    refusal_reason VARCHAR(50) DEFAULT '',
    qualification_detected VARCHAR(100) DEFAULT '',
    qualification_match TINYINT(1) DEFAULT 1,
    coherence_score INT DEFAULT 100,
    call_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    besoin VARCHAR(100) DEFAULT '',
    budget VARCHAR(50) DEFAULT '',
    interet VARCHAR(50) DEFAULT '',
    customer_phone VARCHAR(20) DEFAULT '',
    customer_email VARCHAR(100) DEFAULT '',
    customer_company VARCHAR(100) DEFAULT '',
    qualification VARCHAR(100),
    qualification_coherence BOOLEAN
);

CREATE TABLE IF NOT EXISTS followups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    call_id INT,
    agent_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_name VARCHAR(100),
    appointment_date DATETIME,
    appointment_confidence INT DEFAULT 0,
    status ENUM('a_relancer', 'relance_en_cours', 'relance', 'converti', 'injoignable', 'refus_final') DEFAULT 'a_relancer',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    next_relance_date DATETIME,
    relance_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    call_id INT NOT NULL,
    agent_id VARCHAR(50) NOT NULL,
    detected_date VARCHAR(100),
    confidence_score INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'detected',
    final_date DATETIME,
    client_name VARCHAR(100),
    client_phone VARCHAR(20),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50),
    action VARCHAR(100),
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME DEFAULT NULL
);

INSERT IGNORE INTO users (username, password, name, role, email) VALUES 
('admin', 'admin', 'Administrator', 'admin', 'admin@crm.local');

INSERT IGNORE INTO agents (agent_id, name, role) VALUES
('admin', 'Administrator', 'admin'),
('ali', 'Ali Agent', 'agent'),
('sana', 'Sana Agent', 'agent'),
('omar', 'Omar Agent', 'agent'),
('mariam', 'Mariam Agent', 'agent'),
('youssef', 'Youssef Agent', 'agent');
