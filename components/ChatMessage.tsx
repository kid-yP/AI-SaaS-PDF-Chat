"use client";

import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { BotIcon, Loader2Icon } from "lucide-react";
import Markdown from "react-markdown";
import { Message } from "./Chat";

function ChatMessage({ message }: { message: Message }) {
  const isHuman = message.role === "human";
  const { user } = useUser();

  return (
    <div className={`chat ${isHuman ? "chat-end" : "chat-start"}`}>
      <div className="chat-image avatar">
        <div className="w-10 rounded-full">
          {isHuman ? (
            user?.imageUrl && (
              <Image
                src={user?.imageUrl}
                alt="Profile Picture"
                width={40}
                height={40}
                className="rounded-full"
              />
            )
          ) : (
            <div className="h-10 w-10 bg-indigo-600 flex items-center justify-center rounded-full">
              <BotIcon className="text-white h-7 w-7" />
            </div>
          )}
        </div>
      </div>

      <div
        className={`chat-bubble prose ${isHuman ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-800"}`}
      >
        {message.message === "Thinking..." ? (
          <div className="flex items-center gap-2">
            <Loader2Icon className="animate-spin h-5 w-5 text-white" />
            <span className="text-white">Thinking…</span>
          </div>
        ) : (
          <Markdown>{message.message}</Markdown>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;