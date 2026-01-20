-- Database Schema for SIMtinel (Production)
-- Matches backend queries in server/index.js

CREATE DATABASE IF NOT EXISTS simfraud_db;
USE simfraud_db;

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS SIMFraudRole (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE -- 'USER', 'ADMIN', 'ANALYST'
);

-- 2. Login Credentials (Auth)
CREATE TABLE IF NOT EXISTS SIMFraudLogin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) UNIQUE,
    phone_number VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES SIMFraudRole(id)
);

-- 3. User Profiles
CREATE TABLE IF NOT EXISTS SIMFraudUserProfile (
    id INT AUTO_INCREMENT PRIMARY KEY,
    login_id INT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (login_id) REFERENCES SIMFraudLogin(id)
);

-- 4. Transactions (The core entity for fraud checks)
CREATE TABLE IF NOT EXISTS SIMFraudTransaction (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    channel ENUM('UPI','NETBANKING','CARD','WALLET','OTHER') NOT NULL,
    merchant_id VARCHAR(80),
    device_id VARCHAR(100),
    location VARCHAR(120),
    status ENUM('initiated','approved','declined','blocked') DEFAULT 'initiated',
    tx_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES SIMFraudUserProfile(id)
);

-- 5. AI Prediction Output (Ollama Results)
CREATE TABLE IF NOT EXISTS SIMFraudPredictionOutput (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT UNIQUE NOT NULL,
    fraud_score DECIMAL(5, 4) NOT NULL, -- 0.0000 to 1.0000
    decision ENUM('ALLOW','STEP_UP','BLOCK') NOT NULL,
    model_version VARCHAR(50) DEFAULT 'v1.0',
    features_json JSON,
    explanation_json JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES SIMFraudTransaction(id)
);

-- 6. Alerts (For Admin/User Dashboard)
CREATE TABLE IF NOT EXISTS SIMFraudAlert (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prediction_id INT,
    severity VARCHAR(20),      -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_review', 'closed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prediction_id) REFERENCES SIMFraudPredictionOutput(id)
);

-- Seed Data (Optional - customized for setup)
-- INSERT INTO SIMFraudRole (role_name) VALUES ('ADMIN'), ('USER');
