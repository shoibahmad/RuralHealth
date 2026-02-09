# Testing Offline Functionality - Visual Guide

## 🎯 Goal
Test that your RuralHealthAI app works completely offline and syncs data when back online.

## 📋 Prerequisites
- Node.js installed
- Frontend dependencies installed (`npm install`)
- Backend running (optional for full test)

## 🚀 Step-by-Step Testing Guide

### Step 1: Start the Application

```bash
# Terminal 1: Start Frontend
cd frontend
npm run dev

# Terminal 2: Start Backend (optional)
cd backend
python -m uvicorn main:app --reload
```

**Expected Output:**
```
VITE v7.2.4  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### S