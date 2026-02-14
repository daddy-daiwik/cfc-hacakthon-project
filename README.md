# 🎙️ VoiceMyThoughts

**VoiceRoom** is a real-time social audio platform that allows users to create and join voice chat rooms instantly. Whether you want to host a public discussion or a private hangout with friends, VoiceRoom makes it seamless and interactive.

Screenshot:

<img width="1919" height="906" alt="image" src="https://github.com/user-attachments/assets/fafd9327-2945-417c-89fc-1e5b854760d3" />

 
## ✨ Features

- **🗣️ Real-time Voice Chat**: Crystal clear audio communication using WebRTC (PeerJS).
- **🏠 Room Management**: Create public rooms with tags or private rooms with access codes.
- **💬 Live Text Chat**: Integrated chat feature within every voice room.
- **🛡️ Moderation Tools**:
  - **Mute All**: Host can mute everyone instantly.
  - **Stage Mode**: "Open Mic" toggle to lock the floor.
  - **Kick Users**: Remove disruptive participants.
  - **Individual Mute/Unmute**: Granular control over participant audio.
- **✋ Hand Raising**: Participants can ask to speak visually.
- **👤 User Profiles**: customizable profiles with avatars and bios.
- **📱 Responsive Design**: Works on desktop and mobile.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, CSS (Vanilla)
- **Backend**: Node.js, Express
- **Real-time**: Socket.IO (Signaling & Events), PeerJS (Audio Streaming)
- **Database**: MongoDB (User profiles & Auth)
- **Authentication**: JWT & Local Storage

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas URI)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/daddy-daiwik/cfc-hacakthon-project.git
    cd cfc-hacakthon-project
    ```

2.  **Setup Server**
    ```bash
    cd server
    npm install
    # Create a .env file with:
    # MONGODB_URI=mongodb://localhost:27017/voiceroom
    # PORT=3001
    # JWT_SECRET=your_secret_key
    npm run dev
    ```

3.  **Setup Client**
    ```bash
    cd ../client
    npm install
    npm run dev
    ```

4.  **Open browser** to `http://localhost:5173`

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## 📄 License

This project is licensed under the MIT License.
