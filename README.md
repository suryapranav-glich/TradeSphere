# Marketing Intelligence Dashboard (Nykaa)

A premium full-stack analytical web application fulfilling all requested features, complete with Conversational BI and Generative AI Insights generation.

## 🚀 Tech Stack
- **Frontend**: React (Vite) + Vanilla CSS (Glassmorphism & animations)
- **Visualization**: Recharts
- **Backend**: Python (FastAPI)
- **Database**: SQLite & CSV (`marketing_campaigns.db`)
- **LLM Integration**: Google Gemini API (`gemini-2.5-flash` and `gemini-2.5-pro`)

## 🎨 Features
1. **Interactive Premium Dashboard**: Completely bespoke Vanilla CSS with dark mode, animations, custom scrollbars, and glassmorphism.
2. **AI Business Analyst**: Conversational interface mapping Natural Language Queries directly to DB queries.
3. **KPI Engine**: Automatically retrieves `Revenue`, `ROI`, `Best Channel`, and `Top Customer Segment`.
4. **Insight Generation**: Evaluates total DB performance using Gemini to provide strategic optimization.
5. **Auto Chart Selection**: The system dynamically translates generated SQL context into `bar`, `line`, `pie`, `funnel`, and `table` charts.

## 🏃‍♂ Run Instructions

The system is already installed and running locally, but if you need to restart it later:

### 1. Set up your API key
Inside `backend/`, create a `.env` file containing:
```env
GEMINI_API_KEY=your_google_ai_studio_api_key_here
```
*(If you do not provide an API key, the system will use a smart mock-fallback mode so the dashboard still renders perfectly)*

### 2. Start Backend
```bash
cd backend
python -m uvicorn main:app --port 8000 --reload
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```
Access the application at `http://localhost:5173`.
