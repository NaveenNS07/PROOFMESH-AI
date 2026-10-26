# PROOFMESH AI — Development & Production Deployment Guide

## 1. Local Development
1. Copy `.env.example` to `.env` and configure `GEMINI_API_KEY`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run unit & security rule tests:
   ```bash
   npm run test
   ```
4. Start the full-stack server on port 3000:
   ```bash
   npm run dev
   ```

## 2. Production Deployment (Docker / Cloud Run)
1. Build and start with Docker Compose:
   ```bash
   docker compose up --build -d
   ```
2. Or build standalone container:
   ```bash
   docker build -t proofmesh-ai:latest .
   docker run -p 3000:3000 -e GEMINI_API_KEY="$GEMINI_API_KEY" proofmesh-ai:latest
   ```
