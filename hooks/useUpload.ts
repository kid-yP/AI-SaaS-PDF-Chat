"use client";

import { uploadDocument } from "@/actions/uploadDocument";
import { generateEmbeddings } from "@/actions/generateEmbeddings";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

export enum StatusText {
  UPLOADING = "Uploading file...",
  UPLOADED = "File uploaded successfully",
  SAVING = "Saving file to database...",
  GENERATING = "Generating AI Embeddings, This will only take a few seconds...",
}

export type Status = StatusText[keyof StatusText];

function useUpload() {
  const [progress, setProgress] = useState<number | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const { user } = useUser();
  const router = useRouter();

  const handleUpload = async (file: File) => {
    if (!file || !user) {
      console.error("No file or user found");
      return;
    }

    try {
      // Start upload
      setStatus(StatusText.UPLOADING);
      setProgress(0);

      // Simulate progress (since server-side upload doesn't give granular progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev === null || prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Create FormData for the server action
      const formData = new FormData();
      formData.append("file", file);

      // Call the server action to upload to Cloudinary
      const result = await uploadDocument(formData);

      clearInterval(progressInterval);
      setProgress(100);
      setStatus(StatusText.UPLOADED);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      // The server action already saved to Firestore, so we just need to generate embeddings
      setStatus(StatusText.GENERATING);
      await generateEmbeddings(result.fileId!);

      setFileId(result.fileId!);
      router.push(`/dashboard/files/${result.fileId}`);
    } catch (error) {
      console.error("Upload error:", error);
      setStatus(null);
      setProgress(null);
      // You might want to show a toast notification here
      throw error;
    }
  };

  return { progress, status, fileId, handleUpload };
}

export default useUpload;