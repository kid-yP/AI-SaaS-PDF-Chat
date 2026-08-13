"use server";

import { Message } from "@/components/Chat";
import { adminDb } from "@/firebaseAdmin";
import { generateLangchainCompletion } from "@/lib/langchain";
import { auth } from "@clerk/nextjs/server";

const PRO_LIMIT = 20;
const FREE_LIMIT = 2;

export async function askQuestion(id: string, question: string) {
  auth().protect();
  const { userId } = await auth();

  if (!userId) {
    return { success: false, message: "User not authenticated" };
  }

  // ✅ Log the exact path being used
  console.log("--- askQuestion called with:");
  console.log("   userId:", userId);
  console.log("   fileId:", id);
  console.log("   question:", question);

  const chatRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("files")
    .doc(id)
    .collection("chat");

  // ✅ Log the full Firestore path
  console.log("   Firestore path:", `users/${userId}/files/${id}/chat`);

  // Check how many user messages are in the chat
  const chatSnapshot = await chatRef.get();
  const userMessages = chatSnapshot.docs.filter(
    (doc) => doc.data().role === "human"
  );

  console.log("   Existing messages in chat:", chatSnapshot.docs.length);

  // Check membership limits
  const userRef = await adminDb.collection("users").doc(userId!).get();
  const userData = userRef.data();

  console.log("DEBUG 2", userData);

  // Check if user is on FREE plan
  if (!userData?.hasActiveMembership) {
    console.log("Debug 3", userMessages.length, FREE_LIMIT);
    if (userMessages.length >= FREE_LIMIT) {
      return {
        success: false,
        message: `You'll need to upgrade to PRO to ask more than ${FREE_LIMIT} questions! 😢`,
      };
    }
  }

  // Check if user is on PRO plan
  if (userData?.hasActiveMembership) {
    console.log("Debug 4", userMessages.length, PRO_LIMIT);
    if (userMessages.length >= PRO_LIMIT) {
      return {
        success: false,
        message: `You've reached the PRO limit of ${PRO_LIMIT} questions per document! 😢`,
      };
    }
  }

  // Save user message
  const userMessage: Message = {
    role: "human",
    message: question,
    createdAt: new Date(),
  };
  await chatRef.add(userMessage);

  try {
    // Generate AI Response
    console.log("--- Generating AI response... ---");
    const reply = await generateLangchainCompletion(id, question);

    // Save AI response
    const aiMessage: Message = {
      role: "ai",
      message: reply,
      createdAt: new Date(),
    };
    await chatRef.add(aiMessage);

    console.log("--- AI response saved to Firestore ---");
    console.log("   Path:", `users/${userId}/files/${id}/chat`);
    return { success: true, message: null };
  } catch (error) {
    console.error("--- AI generation error:", error);

    // Save error message to Firestore
    const errorMessage: Message = {
      role: "ai",
      message: "❌ Sorry, I encountered an error while processing your request. Please try again.",
      createdAt: new Date(),
    };
    await chatRef.add(errorMessage);

    return {
      success: false,
      message: "Failed to generate AI response. Please try again.",
    };
  }
}