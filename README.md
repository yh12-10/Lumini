
# 🎓 Lumina AI Learning Assistant

![Lumina AI Banner](https://img.shields.io/badge/Lumina-AI_Learning_Assistant-6366f1?style=for-the-badge) 
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Gemini API](https://img.shields.io/badge/Google-Gemini_Pro-8E75B2?style=for-the-badge&logo=google)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

> **Transform your static documents into an interactive, voice-enabled AI tutor.**

Lumina is a **Progressive Web App (PWA)** designed to revolutionize how students and professionals study. By uploading PDFs, Docs, or Text files, Lumina uses the **Google Gemini API** to generate quizzes, flashcards, summaries, and real-time voice conversations based specifically on your learning material.

---

## 🌟 Features

### 📚 Intelligent Document Processing
*   **Multi-Format Support:** Upload `.pdf`, `.docx`, `.txt`, and `.md` files.
*   **Local Parsing:** Files are processed in the browser using `pdf.js` and `mammoth.js` for privacy.
*   **Smart Caching:** Documents and study progress are saved locally, allowing for offline access to previously loaded content.

### 🧠 Interactive Study Modes
1.  **Original Viewer:** Read your document with a clean, zoomable interface.
2.  **AI Summaries:** 
    *   *Standard:* A comprehensive overview.
    *   *ELI5 (Explain Like I'm 5):* A simplified breakdown using analogies.
3.  **Concept Extraction:** Automatically identifies key terms and definitions.
4.  **Learning Roadmap:** Generates a step-by-step beginner-to-advanced guide based on the content.
5.  **Q&A Generator:** Deep-thinking questions with AI-generated answers.
6.  **Fill in the Blanks:** 
    *   Active recall testing.
    *   **Smart Timer:** "Reveal Answer" button unlocks after 30 seconds of thinking.
7.  **Flashcards:** AI-generated double-sided cards for spaced repetition.
8.  **Gamified Quiz:** Multiple-choice testing with scoring, explanations, and confetti celebrations.

### 🗣️ Multimodal Interaction
*   **Live Voice Tutor:** Real-time, low-latency voice conversation with the AI about your document using Gemini's Native Audio Streaming.
    *   *Mobile Optimized:* Features audio context resumption and visualizers.
*   **Chat RAG:** Text-based chat where the AI answers questions strictly based on the document context.

### 🛠️ Productivity Tools
*   **Creative Studio:** A canvas for drawing diagrams or taking handwritten notes. 
    *   *AI Recognition:* Convert handwriting to text or analyze drawn diagrams using Gemini Vision.
*   **Pomodoro Timer:** Built-in focus timer (25m work / 5m break).
*   **Task Manager:** Track study goals.
*   **Notepad:** Auto-saving sticky notes overlay.

### 🎮 Gamification & Progress
*   **XP System:** Earn experience points for every action (reading, quizzing, chatting).
*   **Streaks:** Daily login tracking.
*   **Levels:** Progress from "Novice" to "Scholar".
*   **Dashboard:** Visual analytics of your study habits using `Recharts`.

---

## 🏗️ Architecture & How It Works

Lumina is built as a **Client-Side Progressive Web App**. It does not rely on a traditional backend database.

1.  **State Management (Lazy Storage):** 
    *   All data (Docs, User Progress, Quizzes) is stored in the browser's `localStorage`.
    *   A custom `Cache Service` ensures data is loaded lazily to prevent overwriting saved data on startup.
    *   **Inactivity Hook:** To prevent memory leaks on mobile, the app auto-refreshes after 30 minutes of inactivity.

2.  **AI Integration (The Brain):**
    *   The app communicates directly with Google's Generative AI servers.
    *   **Models Used:**
        *   `gemini-3-flash-preview`: For text generation, quizzes, and summaries.
        *   `gemini-2.5-flash-native-audio-preview`: For low-latency real-time voice interaction.
        *   `gemini-2.5-flash`: For multimodal image analysis (Creative Studio).

3.  **Responsive Design:**
    *   Built with **Tailwind CSS**.
    *   Uses `dvh` (Dynamic Viewport Height) to ensure perfect scaling on mobile browsers (Safari/Chrome) where address bars shift the layout.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher recommended).
*   A **Google Gemini API Key** (Get it at [aistudio.google.com](https://aistudio.google.com/)).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/lumina-ai-learning.git
    cd lumina-ai-learning
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure API Key:**
    *   Create a `.env` file in the root directory.
    *   Add your API key (Note: The app currently uses `process.env.API_KEY` in the source code configuration, ensure your bundler exposes this).
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open in Browser:**
    Navigate to `http://localhost:5173` (or the port shown in your terminal).

---

## 🛠️ Tech Stack

### Frontend
*   **React 19:** The library for web and native user interfaces.
*   **TypeScript:** For type-safe code and robust development.
*   **Vite:** Next-generation frontend tooling.

### UI & Styling
*   **Tailwind CSS:** Utility-first CSS framework.
*   **Lucide React:** Beautiful, consistent icons.
*   **Recharts:** Composable charting library for the dashboard.
*   **Canvas Confetti:** For gamification rewards.

### AI & Data
*   **@google/genai:** Official SDK for interacting with Gemini models.
*   **PDF.js:** For parsing PDF documents in the browser.
*   **Mammoth.js:** For converting .docx files to text.
*   **React Markdown:** For rendering AI responses securely.

---

## 📱 Mobile Support (PWA)

Lumina is optimized for mobile devices:
*   **Touch Controls:** Drag-and-drop uploads, swipeable tabs.
*   **Audio Handling:** Specialized hooks (`useLiveVoice`) handle mobile browser autoplay policies by forcing AudioContext resumption on user interaction.
*   **Layout:** Sidebar transforms into a hamburger menu on small screens.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Note:** This project relies on local storage. Clearing your browser cache will remove your saved documents and progress unless you export your data (feature coming soon).
