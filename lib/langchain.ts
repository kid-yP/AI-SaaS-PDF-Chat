import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PineconeStore } from "@langchain/pinecone";
import { Index, RecordMetadata } from "@pinecone-database/pinecone";
import { adminDb } from "../firebaseAdmin";
import { auth } from "@clerk/nextjs/server";
import pineconeClient from "./pinecone";

// ============================================
// 1. CONFIGURATION
// ============================================

export const indexName = "chat-pdf-cohere";

// ============================================
// 2. COHERE EMBEDDINGS (v3.0, 1024 dims)
// ============================================

class CohereEmbeddings {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "embed-english-v3.0") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async embedQuery(text: string): Promise<number[]> {
    const response = await fetch("https://api.cohere.ai/v1/embed", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texts: [text],
        model: this.model,
        input_type: "search_query",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cohere API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.embeddings[0];
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const batchSize = 96;
    const batches = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    const allEmbeddings = [];
    for (const batch of batches) {
      const response = await fetch("https://api.cohere.ai/v1/embed", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texts: batch,
          model: this.model,
          input_type: "search_document",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cohere API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      allEmbeddings.push(...data.embeddings);
    }
    return allEmbeddings;
  }
}

const embeddings = new CohereEmbeddings(process.env.COHERE_API_KEY || "");

// ============================================
// 3. FETCH CHAT HISTORY
// ============================================

async function fetchMessagesFromDB(docId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not found");
  }

  const chats = await adminDb
    .collection("users")
    .doc(userId)
    .collection("files")
    .doc(docId)
    .collection("chat")
    .orderBy("createdAt", "desc")
    .get();

  const chatHistory = chats.docs.map((doc) => {
    const data = doc.data();
    return {
      role: data.role === "human" ? "user" : "assistant",
      content: data.message,
    };
  });

  return chatHistory;
}

// ============================================
// 4. GENERATE DOCUMENTS FROM PDF
// ============================================

export async function generateDocs(docId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not found");
  }

  const firebaseRef = await adminDb
    .collection("users")
    .doc(userId)
    .collection("files")
    .doc(docId)
    .get();

  const downloadUrl = firebaseRef.data()?.downloadUrl;

  if (!downloadUrl) {
    throw new Error("Download URL not found");
  }

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status}`);
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error("PDF file is empty");
  }

  const loader = new PDFLoader(blob);
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  return await splitter.splitDocuments(docs);
}

// ============================================
// 5. CHECK NAMESPACE
// ============================================

async function namespaceExists(
  index: Index<RecordMetadata>,
  namespace: string
) {
  if (!namespace) throw new Error("No namespace provided");
  const { namespaces } = await index.describeIndexStats();
  return namespaces?.[namespace] !== undefined;
}

// ============================================
// 6. GENERATE & STORE EMBEDDINGS
// ============================================

export async function generateEmbeddingsInPineconeVectorStore(docId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not found");

  const index = pineconeClient.index(indexName);
  const exists = await namespaceExists(index, docId);

  if (exists) {
    console.log(`--- Reusing existing embeddings for ${docId} ---`);
    return await PineconeStore.fromExistingIndex(embeddings as any, {
      pineconeIndex: index,
      namespace: docId,
    });
  }

  const splitDocs = await generateDocs(docId);
  console.log(
    `--- Storing ${splitDocs.length} chunks in Pinecone using Cohere (${embeddings.model}) ---`
  );

  return await PineconeStore.fromDocuments(splitDocs, embeddings as any, {
    pineconeIndex: index,
    namespace: docId,
  });
}

// ============================================
// 7. GENERATE AI RESPONSE (GROQ – REAL LLM)
// ============================================

const generateLangchainCompletion = async (docId: string, question: string) => {
  console.log(`--- Processing question: "${question}" ---`);

  const vectorStore = await generateEmbeddingsInPineconeVectorStore(docId);
  const retriever = vectorStore.asRetriever({ k: 4 });

  const relevantDocs = await retriever.invoke(question);
  const context = relevantDocs.map((doc: any) => doc.pageContent).join("\n\n");

  const chatHistory = await fetchMessagesFromDB(docId);
  const historyText = chatHistory
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const prompt = `
You are a helpful assistant. Answer the user's question based on the context provided.

Context:
${context}

Chat history:
${historyText}

User: ${question}
Assistant:`;

  // ✅ GROQ API (free, fast, no credit card)
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in environment variables");
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "No response from AI.";

  console.log(`--- Answer: ${reply.substring(0, 100)}... ---`);
  return reply;
};

export { generateLangchainCompletion };