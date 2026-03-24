import { useCallback, useEffect, useState } from "react";

export type Message = {
  id: string;
  message: string;
  role: "user" | "ai";
  createdAt: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

const STORAGE_KEY = "spontana_chat_history_v1";
const MAX_HISTORY = 50;
const DEFAULT_MODEL = "arcee-ai/trinity-mini:free";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Message[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const useChat = () => {
  const [msgs, setMsgs] = useState<Message[]>(() => loadHistory());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  }, [msgs]);

  const clearHistory = useCallback(() => {
    setMsgs([]);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const userMessage = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || isLoading) return;

      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined;
      if (!apiKey) {
        setError("Missing VITE_OPENROUTER_API_KEY. Add it to your .env file.");
        return;
      }

      const userEntry: Message = {
        id: createId(),
        message: trimmed,
        role: "user",
        createdAt: new Date().toISOString(),
      };

      setError(null);
      setIsLoading(true);
      setMsgs((prev) => [...prev, userEntry].slice(-MAX_HISTORY));

      try {
        const historyForModel = [...msgs, userEntry].slice(-12).map((item) => ({
          role: item.role === "ai" ? "assistant" : "user",
          content: item.message,
        }));

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: import.meta.env.VITE_OPENROUTER_MODEL || DEFAULT_MODEL,
            messages: historyForModel,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Request failed (${response.status})`);
        }

        const result = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
          };
        };
        const content = result.choices?.[0]?.message?.content?.trim();

        if (!content) {
          throw new Error("The model returned an empty response.");
        }

        const aiEntry: Message = {
          id: createId(),
          message: content,
          role: "ai",
          createdAt: new Date().toISOString(),
          usage: result.usage,
        };

        setMsgs((prev) => [...prev, aiEntry].slice(-MAX_HISTORY));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, msgs],
  );

  return {
    msgs,
    userMessage,
    isLoading,
    error,
    clearHistory,
  };
};

export default useChat;
