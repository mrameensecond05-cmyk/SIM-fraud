<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

🛡️ SIM-Fraud Detection System (Simtinel)
A comprehensive full-stack solution for detecting and reporting SIM-related fraud using local AI analysis.
📖 Project Overview
The SIM-Fraud System (codenamed Simtinel) is a secure client-server architecture designed to monitor, detect, and analyze fraudulent SIM activity. It consists of a mobile Android agent that interfaces with a centralized Node.js backend.
Unlike cloud-dependent solutions, this system is designed for on-premise/local deployment, utilizing Ollama to run Large Language Models (LLMs) locally for privacy-preserving fraud analysis without data leaving your network.

✨ Key Features
📱 Android Mobile Agent: A dedicated mobile application (simtinel.apk) built with TypeScript for user authentication, real-time data collection, and secure communication with the host server.
🧠 Local AI Integration: Leverages Ollama to run AI models locally, allowing for intelligent data analysis and fraud pattern recognition without external API costs or privacy risks.
🔒 Secure Local Network: Configurable network security policies ensuring safe encrypted communication between mobile devices and the local server instance.
🗄️ MySQL Persistence: Robust relational database integration for storing user profiles, fraud logs, and analysis results.
⚡ Automated Deployment: Includes scripts for seamless APK rebuilding and local OTA (Over-The-Air) distribution.

🛠️ Tech Stack
Component
Technology
Description
Mobile
Android / TypeScript
Client-side application for data gathering.
Backend
Node.js (v18+)
REST API server handling logic and DB connections.
Database
MySQL
Persistent storage for users and logs.
AI / LLM
Ollama
Local inference engine for AI analysis.
Build Tool
Gradle (JDK 17)
Android build automation system.


🏗️ System Architecture
Code snippet
graph TD
    A[Android Device] -->|HTTP Requests| B(Node.js Server)
    B -->|SQL Queries| C[MySQL Database]
    B -->|Prompt/Context| D[Ollama Local AI]
    D -->|Analysis/Response| B
    B -->|JSON Response| A


🚀 Getting Started
Follow the instructions below to set up the development environment, configure the local network, and deploy the application on your device.
(Paste your "SIM-Fraud System Deployment Guide" content here)


