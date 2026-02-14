# Deploying VoiceRoom

Since **VoiceRoom** uses **Socket.IO** (WebSockets) and **In-Memory Storage** (for active rooms), it requires a backend hosting provider that supports long-running processes. Standard "Serverless" platforms (like Vercel's backend hosting) will **NOT** work for the server because they kill the connection after a few seconds.

We recommend a **Split Deployment** (Frontend on Vercel, Backend on Render or Railway):

---

## Option 1: Deploy Backend to Render (Free Tier Available)

1.  Push your latest code to GitHub (you just did this!).
2.  Go to [Render.com](https://render.com) and create a free account.
3.  Click **"New +"** -> **"Web Service"**.
4.  Connect your GitHub repository (`voiceroom-app`).
5.  **Configure the Service**:
    *   **Root Directory**: `server` (IMPORTANT!)
    *   **Build Command**: `npm install`
    *   **Start Command**: `node index.js`
    *   **Instance Type**: Free
6.  **Environment Variables** (Add these in the "Environment" tab):
    *   `MONGODB_URI`: Your MongoDB connection string.
    *   `PORT`: `3001` (or let Render handle it).
7.  Click **"Create Web Service"**.
8.  **Copy the URL**: (e.g., `https://voiceroom-server.onrender.com`).

---

## Option 2: Deploy Backend to Railway (Recommended for Ease of Use)

1.  Go to [Railway.app](https://railway.app) and login with GitHub.
2.  Click **"New Project"** -> **"Deploy from GitHub repo"**.
3.  Select your repo (`voiceroom-app`).
4.  **Important**: The initial build will fail because Railway looks for code in the root folder.
    *   Click on your service card -> **Settings**.
    *   **Root Directory**: Change `/` to `/server`.
    *   This will trigger a new deployment automatically.
5.  **Variables**:
    *   Go to **Variables** tab.
    *   Add `MONGODB_URI` (your database URL).
    *   Add `PORT` = `3001` (or verify Railway's assigned port variable).
6.  **Public URL**:
    *   Go to **Settings** -> **Networking** -> **Generate Domain**.
    *   Copy this URL (e.g., `https://voiceroom-production.up.railway.app`).

---

---

## Part 2: Deploy Frontend to Vercel

1.  Go to [Vercel.com](https://vercel.com) and create a free account.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your same GitHub repository (`voiceroom-app`).
4.  **Configure the Project**:
    *   **Root Directory**: Click "Edit" and select `client`.
    *   **Framework Preset**: Vite (should be auto-detected).
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
5.  **Environment Variables**:
    *   Name: `VITE_API_URL`
    *   Value: `https://voiceroom-server.onrender.com` (The URL you copied from Render).
    *   *Note: Does not need quotes.*
6.  Click **"Deploy"**.

---

## 🎉 Done!

Your app is now live!
*   Visit the Vercel URL to use the app.
*   The frontend will automatically connect to your Render backend.
