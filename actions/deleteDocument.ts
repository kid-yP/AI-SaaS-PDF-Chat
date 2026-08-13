"use server";

import { adminDb } from "@/firebaseAdmin";
import { indexName } from "@/lib/langchain";
import pineconeClient from "@/lib/pinecone";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function deleteDocument(docId: string) {
  auth().protect();

  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not found");
  }

  // Get the document to find the Cloudinary public_id
  const docRef = await adminDb
    .collection("users")
    .doc(userId)
    .collection("files")
    .doc(docId)
    .get();

  const docData = docRef.data();

  // Delete from Cloudinary if we have the public_id
  if (docData?.cloudinaryPublicId) {
    try {
      await cloudinary.uploader.destroy(docData.cloudinaryPublicId, {
        resource_type: "raw", // For PDFs
      });
    } catch (error) {
      console.error("Failed to delete from Cloudinary:", error);
    }
  }

  // Delete the document from Firestore
  await adminDb
    .collection("users")
    .doc(userId)
    .collection("files")
    .doc(docId)
    .delete();

  // Delete all embeddings associated with the document
  const index = await pineconeClient.index(indexName);
  await index.namespace(docId).deleteAll();

  revalidatePath("/dashboard");
}