-- Database Schema for SIMtinel

CREATE DATABASE IF NOT EXISTS simtinel;
USE simtinel;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    status ENUM('ACTIVE', 'SUSPENDED', 'FLAGGED') DEFAULT 'ACTIVE',
    risk_score INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    type ENUM('PHISHING_STOPPED', 'ACCOUNT_FLAGGED', 'SUSPICIOUS_LOGIN', 'SIM_SWAP_BLOCKED') NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    details TEXT,
    status ENUM('ACTIVE', 'RESOLVED', 'INVESTIGATING') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Global Alerts Feed (SMS Logs)
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(50) PRIMARY KEY,
    sender VARCHAR(50),
    message_text TEXT,
    risk_score INT,
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    reasoning TEXT,
    is_aadhaar_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data
INSERT INTO users (id, name, email, role, status, risk_score) VALUES
('u-1', 'Admin User', 'admin@simtinel.com', 'ADMIN', 'ACTIVE', 0),
('u-2', 'Alex Smith', 'alex.smith@example.com', 'USER', 'ACTIVE', 12),
('u-3', 'Sarah Conner', 'sarah.c@sky.net', 'USER', 'FLAGGED', 85);

INSERT INTO incidents (id, user_id, type, severity, details, status) VALUES
('inc-1', 'u-3', 'SIM_SWAP_BLOCKED', 'CRITICAL', 'Unauthorized port-out attempt blocked.', 'INVESTIGATING');
