-- Database Schema for SIMtinel (Production - 11 Tables)
-- Matches Advanced AI Requirements

CREATE DATABASE IF NOT EXISTS simfraud_db;
USE simfraud_db;

-- Disable FK checks to allow easy table creation/modification
SET FOREIGN_KEY_CHECKS = 0;

-- 1. SIMFraudRole
CREATE TABLE IF NOT EXISTS SIMFraudRole (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE -- 'USER', 'ADMIN', 'ANALYST'
);

-- 2. SIMFraudLogin
CREATE TABLE IF NOT EXISTS SIMFraudLogin (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) UNIQUE,
    phone_number VARCHAR(20) NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES SIMFraudRole(id)
);

-- 3. SIMFraudUserProfile
CREATE TABLE IF NOT EXISTS SIMFraudUserProfile (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    login_id BIGINT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NULL,
    place_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (login_id) REFERENCES SIMFraudLogin(id) ON DELETE CASCADE
);

-- 4. SIMFraudLoginEvent (New)
CREATE TABLE IF NOT EXISTS SIMFraudLoginEvent (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    device_info VARCHAR(255),
    success_flag BOOLEAN DEFAULT TRUE,
    failed_reason VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES SIMFraudUserProfile(id)
);

-- 5. SIMFraudSIMEvent (New - Context for AI)
CREATE TABLE IF NOT EXISTS SIMFraudSIMEvent (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_type ENUM('swap_success', 'imei_change', 'new_sim') NOT NULL,
    old_imei VARCHAR(50),
    new_imei VARCHAR(50),
    location VARCHAR(120),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_channel VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES SIMFraudUserProfile(id)
);

-- 6. SIMFraudTransaction
CREATE TABLE IF NOT EXISTS SIMFraudTransaction (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    channel ENUM('UPI','NETBANKING','CARD','WALLET','OTHER') NOT NULL,
    merchant_id VARCHAR(80),
    device_id VARCHAR(100),
    location VARCHAR(120),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, -- changed from tx_time to match prompt requirements, or aliased
    status ENUM('initiated','approved','declined','blocked') DEFAULT 'initiated',
    FOREIGN KEY (user_id) REFERENCES SIMFraudUserProfile(id)
);

-- 7. SIMFraudPredictionOutput
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

-- 8. SIMFraudAlert
CREATE TABLE IF NOT EXISTS SIMFraudAlert (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prediction_id BIGINT, -- Changed to BIGINT to match Prediction ID
    severity VARCHAR(20),      -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_review', 'closed'
    assigned_to BIGINT, -- Login ID of analyst
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    FOREIGN KEY (prediction_id) REFERENCES SIMFraudPredictionOutput(id)
);

-- 9. SIMFraudComplaint (New)
CREATE TABLE IF NOT EXISTS SIMFraudComplaint (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    complaint_type VARCHAR(50),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, resolved
    reply_message TEXT,
    replied_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES SIMFraudUserProfile(id)
);

-- 10. SIMFraudConfig (New - Fraud Thresholds)
CREATE TABLE IF NOT EXISTS SIMFraudConfig (
    id INT AUTO_INCREMENT PRIMARY KEY,
    param_name VARCHAR(100) UNIQUE NOT NULL,
    param_value VARCHAR(255) NOT NULL,
    updated_by BIGINT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 11. SIMFraudAuditLog (New - AI Analysis Log)
CREATE TABLE IF NOT EXISTS SIMFraudAuditLog (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_login_id BIGINT,
    action VARCHAR(100) NOT NULL, -- 'OLLAMA_ANALYSIS', 'LOGIN', etc.
    entity_type VARCHAR(50), -- 'transaction', 'user'
    entity_id BIGINT,
    ip_address VARCHAR(45),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata_json JSON
);

-- Initial Seed Data for Config
INSERT INTO SIMFraudConfig (param_name, param_value) VALUES 
('block_threshold', '0.85'),
('step_up_threshold', '0.65')
ON DUPLICATE KEY UPDATE param_value=VALUES(param_value);

-- 12. SIMFraudOTP (New - Phone Verification)
CREATE TABLE IF NOT EXISTS SIMFraudOTP (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
);

-- Initial Roles
INSERT INTO SIMFraudRole (role_name) VALUES ('USER'), ('ADMIN')
ON DUPLICATE KEY UPDATE role_name=role_name;

SET FOREIGN_KEY_CHECKS = 1;
