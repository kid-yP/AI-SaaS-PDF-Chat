# 📚 Chat with PDF – AI SaaS Application

![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)
![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue?style=flat&logo=tailwindcss)

> **Upload a PDF and start chatting with it – powered by AI, built with modern full-stack tools.**

---

## 🚀 Live Demo

🔗 **[View Live Application](https://ai-saa-s-pdf-chat.vercel.app)**

---

## 📖 About The Project

**Chat with PDF** is a full-stack AI SaaS application that allows users to upload PDF documents and ask questions about their content using natural language. The app processes PDFs, generates embeddings, stores them in a vector database, and uses a large language model to provide accurate, context-aware answers.

**Purpose:** Built as a portfolio project to demonstrate modern full-stack development skills, AI integration, and SaaS architecture.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **State Management:** React Hooks
- **UI Components:** Shadcn/ui, Lucide Icons

### Backend & APIs
- **Authentication:** Clerk (secure user management)
- **Database:** Firebase Firestore (NoSQL, real-time)
- **File Storage:** Cloudinary (PDF uploads)
- **AI & Embeddings:** 
  - **Groq** (`llama-3.1-8b-instant`) – LLM for answering questions
  - **Cohere** (`embed-english-v3.0`) – Text embeddings
- **Vector Database:** Pinecone (vector search, similarity retrieval)
- **Payments:** Stripe Checkout (subscription management)

### DevOps & Deployment
- **Hosting:** Vercel (serverless deployment)
- **Version Control:** Git + GitHub
- **Package Manager:** npm

### Key Libraries
- **LangChain:** PDFLoader, document splitting, vector store integration
- **React-PDF:** PDF rendering
- **React-Markdown:** AI response formatting
- **Firebase Admin SDK:** Server-side Firestore operations

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| ✅ **PDF Upload** | Drag & drop PDF uploads via Cloudinary |
| ✅ **AI-Powered Q&A** | Ask questions about your PDF and get accurate answers |
| ✅ **Real-Time Chat** | Instant messaging UI with live updates |
| ✅ **Vector Search** | Retrieval-Augmented Generation (RAG) using Pinecone |
| ✅ **Pro/Free Plans** | Free tier: 10 questions per document. Pro: unlimited |
| ✅ **Stripe Payments** | Subscription-based pricing with Stripe Checkout |
| ✅ **User Authentication** | Clerk sign-up/sign-in with social providers |
| ✅ **PDF Viewer** | Interactive PDF viewing with zoom, rotation, and navigation |

---

## 📦 How It Works

### Architecture Overview
User Uploads PDF → Cloudinary (storage) → Firestore (metadata)
↓
PDF Processing → LangChain PDFLoader → Chunking → Cohere Embeddings → Pinecone (vector store)
↓
User Asks Question → Query Pinecone (similarity search) → Retrieve relevant chunks → Groq (LLM) → Answer
↓
Answer displayed in chat + saved to Firestore chat history


### Data Flow

1. **Upload:** User uploads a PDF → stored in Cloudinary.
2. **Processing:** PDF is split into chunks → converted to embeddings via Cohere → stored in Pinecone.
3. **Chat:** User asks a question → Pinecone retrieves relevant chunks → Groq generates a response.
4. **History:** All messages are saved to Firestore for real-time display.

---


---

## 🔧 Installation & Setup

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm
- Accounts for: Clerk, Stripe, Pinecone, Cohere, Groq, Cloudinary, Firebase

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/your-username/ai-saas-pdf-chat.git
cd ai-saas-pdf-chat

2, **Install dependencies**
npm install

3, Set up environment variables
cp .env.example .env.local
# Fill in your API keys (see .env.example for required variables)

4, npm run dev

## 👨‍💻 Author
  Kidus Yosef

📜 License
This project is open-source and available under the MIT License.

🙏 Acknowledgements
Clerk – Authentication

Stripe – Payments

Pinecone – Vector Database

Cohere – Embeddings

Groq – LLM

Cloudinary – File Storage

Firebase – Database

Vercel – Hosting
