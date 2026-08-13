"use client";

import { FormEvent, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, RefreshCw } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { useUser } from "@clerk/nextjs";
import { collection, orderBy, query, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { askQuestion } from "@/actions/askQuestion";
import { useToast } from "./ui/use-toast";

export type Message = {
  id?: string;
  role: "human" | "ai" | "placeholder";
  message: string;
  createdAt: Date;
};

function Chat({ id }: { id: string }) {
  const { user } = useUser();
  const { toast } = useToast();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ✅ Manual fetch with useCallback to fix ESLint warning
  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const q = query(
        collection(db, "users", user.id, "files", id, "chat"),
        orderBy("createdAt", "asc")
      );
      const snapshot = await getDocs(q);
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        role: doc.data().role as "human" | "ai",
        message: doc.data().message,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      setMessages(newMessages);
      console.log(`✅ Manually fetched ${newMessages.length} messages`);
    } catch (err) {
      console.error("Manual fetch error:", err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [user, id]);

  // Real‑time listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.id, "files", id, "chat"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          role: doc.data().role as "human" | "ai",
          message: doc.data().message,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
        console.log(`📨 Real‑time update: ${newMessages.length} messages`);
        setMessages(newMessages);
        setIsLoading(false);
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
      },
      (error) => {
        console.error("🔥 Listener error:", error);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user, id]);

  // ✅ Initial load – now includes fetchMessages in deps
  useEffect(() => {
    if (user) fetchMessages();
  }, [user, fetchMessages]);

  // Scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;
    setInput("");

    setMessages((prev) => [
      ...prev,
      { role: "human", message: question, createdAt: new Date() },
      { role: "ai", message: "Thinking...", createdAt: new Date() },
    ]);

    startTransition(async () => {
      try {
        const { success, message } = await askQuestion(id, question);
        if (!success) {
          setMessages((prev) => {
            const filtered = prev.filter((m) => !(m.role === "ai" && m.message === "Thinking..."));
            return [
              ...filtered,
              { role: "ai", message: `❌ ${message}`, createdAt: new Date() },
            ];
          });
          toast({ variant: "destructive", title: "Error", description: message });
        } else {
          // ✅ Immediately fetch the new messages (including AI response)
          await fetchMessages();
        }
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => {
          const filtered = prev.filter((m) => !(m.role === "ai" && m.message === "Thinking..."));
          return [
            ...filtered,
            {
              role: "ai",
              message: "An unexpected error occurred. Please try again.",
              createdAt: new Date(),
            },
          ];
        });
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get a response from the AI",
        });
      }
    });
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <p className="text-sm text-gray-500">
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMessages}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5">
          {messages.length === 0 && (
            <ChatMessage
              message={{
                role: "ai",
                message: "Ask me anything about the document!",
                createdAt: new Date(),
              }}
            />
          )}
          {messages.map((msg, idx) => (
            <ChatMessage key={msg.id || idx} message={msg} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex sticky bottom-0 space-x-2 p-5 bg-indigo-600/75">
        <Input
          placeholder="Ask a Question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isPending}
          className="bg-white/90"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isPending}
          className="bg-white text-indigo-600"
        >
          {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Ask"}
        </Button>
      </form>
    </div>
  );
}

export default Chat;
