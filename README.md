# 🧠 MindMirror

### Real-time Social Media Manipulation Detection System

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

---

## 📖 Table of Contents

- What is MindMirror?
- Why Build This?
- How It Works
- Features
- Tech Stack
- Architecture
- Installation
- Usage
- Project Structure
- Future Roadmap
- Contributing

---

## 🎯 What is MindMirror?

**MindMirror is your personal AI shield against social media manipulation.**

Social media algorithms don't optimize for truth or your wellbeing – they optimize for engagement. That often means showing you outrage, fear, and division because those emotions keep you scrolling.

MindMirror sits between you and the algorithm. It analyzes your feed in real-time and alerts you when content is trying to manipulate your emotions.

**No cloud. No data sharing. Complete privacy.**

---

## 🤔 Why Build This?

| Problem | MindMirror Solution |
|---------|---------------------|
| You feel angry/anxious after scrolling | Detects emotional manipulation patterns |
| You can't tell if content is biased | Provides bias & manipulation scoring |
| You see only one side of issues | "The Other Side" shows counter-perspectives |
| You waste hours on addictive content | Weekly reports show your exposure patterns |
| You worry about your data privacy | Everything runs locally on your laptop |

---

## ⚙️ How It Works
<img width="1440" height="2560" alt="image" src="https://github.com/user-attachments/assets/2eb5a5b1-503f-4bca-a388-707d31f78fca" />
---

## ✨ Features

### 🔴 Real-time Manipulation Detection

| Manipulation Type | Example | Detection Method |
|-------------------|---------|------------------|
| Fear-mongering | "Warning! Danger!" | BERT + keyword patterns |
| Urgency | "Limited time!" | Temporal phrase detection |
| Outrage-bait | "Unbelievable!" | Emotion + intensity scoring |
| Us-vs-Them | "They don't want you to know" | Polarization detection |
| Social Proof | "Millions agree!" | Numerical claims analysis |

### 📊 Weekly Analytics Dashboard

- **Echo Chamber Score** – How diverse is your feed?
- **Manipulation Trends** – Which tactics increased this week?
- **Emotion Timeline** – How did your feed's emotional tone change?
- **Topic Clustering** – What subjects are most manipulated?

### 🔍 "The Other Side" Feature

- One-click semantic search for counter-perspectives
- Powered by FAISS vector database
- Retrieves articles, Reddit threads, Twitter threads from trusted sources

### 🛡️ Privacy-first Architecture

- All AI models run locally
- Zero API calls to cloud services
- No data leaves your laptop
- Full transparency – inspect every component

---

## 🛠️ Tech Stack

### Backend (Python)
```yaml
API Framework: FastAPI
ML Models: HuggingFace Transformers (BERT, RoBERTa, DistilBERT)
Embeddings: sentence-transformers (all-MiniLM-L6-v2)
Vector Search: FAISS (CPU-optimized)
Database: SQLite
Server: Uvicorn
Chrome Extension (JavaScript)
Manifest: V3
Permissions: activeTab, storage, host_permissions
Target Sites: Instagram, YouTube, Reddit
Communication: Fetch API → localhost:8000
Dashboard (React)
Framework: React 18
Styling: Tailwind CSS
Charts: Recharts
HTTP Client: Axios
Routing: React Router v6
```

## 📐 Architecture Diagram
<img width="1440" height="840" alt="image" src="https://github.com/user-attachments/assets/15f6a2e0-5322-4fba-b5e2-caa1b82b040e" />

## 💻 Installation

-> Prerequisites

Required: 

Python 3.10+

Node.js 18+

Chrome Browser

-> Optional (for development)

Git

VS Code with Python/JS extensions

Step 1: Clone the Repository

Step 2: Backend Setup
```
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
Backend runs at http://localhost:8000

Step 3: Chrome Extension Setup

-> Open Chrome and go to chrome://extensions/

-> Enable Developer Mode (top right)

-> Click Load Unpacked

-> Select the extension folder

-> Pin the MindMirror extension to your toolbar


Step 4: Dashboard Setup
```
cd dashboard
npm install
npm start
```
Dashboard runs at http://localhost:3000

## 🚀 Usage
Quick Start

-> Start the backend – python backend/main.py

-> Go to Instagram/YouTube/Reddit in Chrome

-> Scroll through your feed

-> Click the MindMirror extension icon to see real-time alerts

-> Open http://localhost:3000 for weekly reports


## 📁 Project Structure
<img width="1440" height="1800" alt="image" src="https://github.com/user-attachments/assets/5ec0d6cb-9976-476f-bc1a-fdac45858a1d" />

## 🗺️ Future Roadmap

Video analysis – Extract and analyze audio/text from Reels/Shorts

Cross-platform correlation – Track manipulation across Instagram + YouTube + Twitter

Bot network detection – Identify coordinated manipulation campaigns

Custom fine-tuning UI – Train your own manipulation detector

Docker deployment – One-command setup

Mobile app – iOS/Android version

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository

2. Create a feature branch (git checkout -b feature/AmazingFeature)

3. Commit your changes (git commit -m 'Add some AmazingFeature')

4. Push to the branch (git push origin feature/AmazingFeature)

5. Open a Pull Request

## ⭐ Show Your Support
If this project helped you, please give it a star ⭐ on GitHub!

Built with 🧠 and ☕ by Bushra Tayyab

