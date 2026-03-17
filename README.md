# BodyByte 🥗

A smart, AI-driven nutrition tracker for Indian and global foods, powered by Google Gemini.

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Add your Gemini API key to `.env.local`:
   ```
   API_KEY=your_gemini_api_key_here
   ```
3. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

1. Push this project to a GitHub repository
2. Import the repo in [Vercel](https://vercel.com)
3. In Vercel project settings → **Environment Variables**, add:
   - `API_KEY` = your Gemini API key
4. Deploy — Vercel auto-detects Vite and builds correctly

> Get your Gemini API key at https://aistudio.google.com/app/apikey
