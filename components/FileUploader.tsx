"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  CheckCircleIcon,
  CircleArrowDown,
  HammerIcon,
  RocketIcon,
  SaveIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/actions/uploadDocument";
import { useToast } from "./ui/use-toast";

function FileUploader() {
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      setProgress(0);
      setStatus("UPLOADING");

      try {
        // Create FormData
        const formData = new FormData();
        formData.append("file", file);

        // Simulate progress (since Cloudinary doesn't give progress easily)
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev === null || prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 500);

        setStatus("UPLOADING");
        const result = await uploadDocument(formData);

        clearInterval(progressInterval);
        setProgress(100);
        setStatus("UPLOADED");

        toast({
          title: "Success!",
          description: "Your document has been uploaded.",
        });

        // Navigate to the document page
        if (result.fileId) {
          router.push(`/dashboard/files/${result.fileId}`);
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "There was an error uploading your document.",
        });
        setProgress(null);
        setStatus("");
      } finally {
        setIsUploading(false);
      }
    },
    [router, toast]
  );

  const statusIcons: {
    [key: string]: JSX.Element;
  } = {
    UPLOADING: <RocketIcon className="h-20 w-20 text-indigo-600" />,
    UPLOADED: <CheckCircleIcon className="h-20 w-20 text-indigo-600" />,
    SAVING: <SaveIcon className="h-20 w-20 text-indigo-600" />,
    GENERATING: <HammerIcon className="h-20 w-20 text-indigo-600 animate-bounce" />,
  };

  const { getRootProps, getInputProps, isDragActive, isFocused, isDragAccept } =
    useDropzone({
      onDrop,
      maxFiles: 1,
      accept: {
        "application/pdf": [".pdf"],
      },
    });

  const uploadInProgress = progress !== null && progress >= 0 && progress <= 100;

  return (
    <div className="flex flex-col gap-4 items-center max-w-7xl mx-auto">
      {uploadInProgress && (
        <div className="mt-32 flex flex-col justify-center items-center gap-5">
          <div
            className={`radial-progress bg-indigo-300 text-white border-indigo-600 border-4 ${
              progress === 100 && "hidden"
            }`}
            role="progressbar"
            style={{
              // @ts-ignore
              "--value": progress,
              "--size": "12rem",
              "--thickness": "1.3rem",
            }}
          >
            {progress} %
          </div>

          {
            // @ts-ignore
            statusIcons[status]
          }

          <p className="text-indigo-600 animate-pulse">{status}</p>
        </div>
      )}

      {!uploadInProgress && (
        <div
          {...getRootProps()}
          className={`p-10 border-2 border-dashed mt-10 w-[90%] border-indigo-600 text-indigo-600 rounded-lg h-96 flex items-center justify-center ${
            isFocused || isDragAccept ? "bg-indigo-300" : "bg-indigo-100"
          }`}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center justify-center">
            {isDragActive ? (
              <>
                <RocketIcon className="h-20 w-20 animate-ping" />
                <p>Drop the files here ...</p>
              </>
            ) : (
              <>
                <CircleArrowDown className="h-20 w-20 animate-bounce" />
                <p>Drag n drop some files here, or click to select files</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUploader;