# Deploying VoiceRoom

Since **VoiceRoom** uses **Socket.IO** (WebSockets) and **In-Memory Storage** (for active rooms), it requires a backend hosting provider that supports long-running processes. Standard "Serverless" platforms (like Vercel's backend hosting) will **NOT** work for the server because they kill the connection after a few seconds.

We recommend a **Split Deployment**:
1.  **Frontend (Client)** -> Deployed on **Vercel** (Free & Fast)
2.  **Backend (Server)** -> Deployed on **Render** (Free & Supports WebSockets)

---

## Part 1: Deploy Backend to Render

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
    *   `MONGODB_URI`: Your MongoDB connection string (from MongoDB Atlas).
    *   `PORT`: `3001` (or let Render handle it, usually they set a `PORT` var).
7.  Click **"Create Web Service"**.
8.  **Copy the URL**: Once deployed, Render will give you a URL like `https://voiceroom-server.onrender.com`. Copy this!

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
