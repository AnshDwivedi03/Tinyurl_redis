﻿# Tinyurl_redis
# 🔗 Redis-Based URL Shortener with Public API Support

This is a full-stack Node.js web application that shortens URLs using Redis for caching and NanoID for generating short URLs. It authenticates users via JWT tokens, securely stores passwords using bcrypt, and interacts with a public API before generating a short link.

## 🚀 Features

- 🔐 JWT-based Authentication
- 🔒 Secure password hashing with Bcrypt
- 🟥 Redis-based response caching
- 🔗 Unique short URL generation using NanoID
- 🌐 Supports dynamic input for public GET APIs
- 🧾 Cookie-based session support

---

## 📦 Tech Stack

- **Backend**: Node.js, Express
- **Auth**: JWT (JSON Web Tokens), bcrypt
- **Cache**: Redis
- **ID Generation**: NanoID
- **Database**: (Optional – Redis only or MongoDB if extended)

---

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/your-username/redis-url-shortener.git
cd redis-url-shortener

# Install dependencies
npm install

# Create a `.env` file in the root with the following:
PORT=5000
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379

# Run the server
npm start
