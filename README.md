
---

# `ChatWithPDF`

```markdown
# ChatWithPDF — AI SaaS PDF Q&A

**Demo currently offline — see screenshots below.**  
Repo: :contentReference[oaicite:2]{index=2}

**One-line**  
Upload PDFs and ask natural-language questions about them. A RAG pipeline (chunk → embeddings → vector search → LLM) returns citation-backed answers for reliable results.

---

## Tags
`#nextjs` `#typescript` `#rag` `#pinecone` `#cohere` `#llm` `#saas` `#ai` `#firestore` `#stripe`

---

## Status & evaluation

Free tier: 10 questions per document.  
Development QA: ~80% citation accuracy in top-3 retrievals (manual test on 10 sample questions).

---

## Key features

- **PDF upload and processing** (chunking + embeddings)  
- **Retrieval-Augmented Generation (RAG)** using Cohere embeddings + Pinecone similarity search  
- **LLM orchestration** (Groq (Llama 3.1)) for answer generation  
- **Real-time chat style UI** (Firestore listeners for realtime messages)  
- **Authentication** (Clerk) and **subscription payments** (Stripe Checkout)  
- **Free / Pro tiers** and usage tracking

---

## Tech stack

**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI  
**Backend:** Node.js API routes, Firebase Firestore (metadata & chat)  
**AI & embeddings:** Cohere (embeddings), Pinecone (vector DB), Groq (Llama 3.1)  
**Auth & Payments:** Clerk (auth), Stripe Checkout (subscriptions)  
**File storage:** Cloudinary  
**Hosting:** Vercel for frontend / serverless functions

---

## How it works (high level)

User uploads PDF → File storage (Cloudinary) → Processing job:  
- PDFLoader / chunking → Cohere embeddings → Pinecone upsert  
User asks a question → Pinecone similarity search → retrieve chunks → LLM (Groq) → answer returned  
Answers and chats saved to Firestore for realtime UI

---

## Getting started (local dev)

**Prerequisites**

- Node.js 18+  
- Accounts / keys for: Clerk, Stripe, Pinecone, Cohere, Groq, Cloudinary

**Quick start**

```bash
git clone <repo-url>
cd AI-SaaS-PDF-Chat
cp .env.example .env.local
# Fill env with required keys (CLERK_, STRIPE_, PINECONE_, COHERE_, GROQ_, CLOUDINARY_)
npm install
npm run dev
