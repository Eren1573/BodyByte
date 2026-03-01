# 🍎 BodyByte — Nutrition in every byte.

A smart, AI-powered nutrition tracker built for Indian and global diets. Log meals by typing or snapping a photo, track macros and micros, monitor water intake, and get weekly AI-generated insights — all in a clean, fast, mobile-first web app.

**Live:** [body-byte.vercel.app](https://body-byte.vercel.app)

---

## ✨ Features

### 🤖 AI-Powered Logging
- **Text logging** — Type anything natural: *"2 roti with dal"*, *"chicken biryani 1 plate"*, *"1 cup chai"*
- **Photo snap** — Take or upload a photo of your meal and AI identifies and analyses it
- **Indian portion understanding** — Knows katori (~150g), roti (~32g), paratha (~70g), idli, dosa and more
- **Saved foods** — Star any logged item to save it for 1-tap re-logging later

### 📊 Tracking & Stats
- **Macro rings** — Animated SVG rings for Protein, Carbs, Fat, Fiber
- **Micronutrients** — Tracks Calcium, Iron, Vitamin A, Vitamin C
- **7-day calorie chart** — Visual weekly trend vs your daily target
- **Water tracker** — Quick-add buttons, daily reset, animated progress bar
- **Weight tracking** — Log weight entries over time with a chart

### 🗓️ History
- **Calendar strip** — Tap any of the last 7 days to view that day's meals
- **Streaks & badges** — 6 unlockable badges (First Log, 3-day streak, 7-day Warrior, etc.)

### 🧠 Weekly AI Summary
- Tap "Get Weekly Summary" in Stats for a personalised coach message based on your last 7 days

### 🔐 Authentication
- Sign up / Sign in with email + password
- Data persists per user in localStorage

### 📱 PWA — Installable
- Works offline (cached assets)
- "Add to Home Screen" on Android and iOS
- Feels like a native app

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| AI | Google Gemini 2.0 Flash (`@google/genai`) |
| Deployment | Vercel |
| PWA | Service Worker + Web App Manifest |

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/Eren1573/BodyByte.git
cd BodyByte
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:
```
VITE_API_KEY=your_gemini_api_key_here
```

Get your free API key at [aistudio.google.com](https://aistudio.google.com) → API Keys → Create API Key.

> ⚠️ The `VITE_` prefix is required — Vite only exposes env variables with this prefix to the browser bundle.

### 4. Run locally
```bash
npm run dev
```

### 5. Build for production
```bash
npm run build
```

---

## 📁 Project Structure

```
├── public/
│   ├── logo.png          # App icon / favicon
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service worker
├── components/
│   ├── Dashboard.tsx     # Home screen with rings, calendar, meal logs
│   ├── FoodLogger.tsx    # Text/camera logging modal
│   ├── Stats.tsx         # Daily breakdown + weekly chart + AI summary
│   ├── Profile.tsx       # Weight chart, badges, settings
│   ├── Onboarding.tsx    # 3-step setup flow
│   ├── SignIn.tsx        # Auth screen
│   ├── WaterTracker.tsx  # Water intake widget
│   ├── ProgressBar.tsx   # Reusable macro/micro bar
│   └── LoadingSpinner.tsx
├── services/
│   └── geminiService.ts  # All Gemini AI calls + local fallback formulas
├── App.tsx               # Root — state, routing, localStorage persistence
├── types.ts              # TypeScript interfaces
└── index.tsx             # Entry point
```

---

## 🧮 Calorie Calculation

Targets are calculated using the **Mifflin-St Jeor equation** (used by dietitians):

```
Male BMR   = 10×weight + 6.25×height − 5×age + 5
Female BMR = 10×weight + 6.25×height − 5×age − 161
```

Multiplied by **1.55** for moderate activity → daily calorie target.

- Protein: `weight × 1.8 g/kg`
- Fat: `25% of calories`
- Carbs: remaining calories
- Water: `weight × 35 ml/kg`

This runs locally as a fallback if Gemini is unavailable, so targets are always accurate — never hardcoded defaults.

---

## 📸 Screenshots

| Dashboard | Log Food | Stats |
|---|---|---|
| Macro rings, water tracker, meal logs | AI text/photo analysis | Weekly chart, progress bars |

---

## 🙌 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

*Built with ❤️ using React + Gemini AI*
