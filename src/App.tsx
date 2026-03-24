import type { ReactNode, SubmitEventHandler } from "react";
import { Fragment, useState } from "react";
import useChat from "./hooks/useChat";

function App() {
  const [userMessage, setUserMessage] = useState("");
  const { msgs, userMessage: sendMessage, isLoading, error, clearHistory } = useChat();
  const totalTokensUsed = msgs.reduce((sum, msg) => sum + (msg.usage?.total_tokens ?? 0), 0);
  const lastUsage = [...msgs].reverse().find((msg) => msg.usage)?.usage;

  const normalizeMessage = (text: string) =>
    text
      .replace(/\r\n/g, "\n")
      .replace(/\s+(?=\d+\.\s)/g, "\n")
      .replace(/\s+(?=[-*]\s)/g, "\n");

  const renderInline = (text: string) => {
    const parts = text.split("**");
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <strong key={`${part}-${index}`} className="font-semibold">
          {part}
        </strong>
      ) : (
        <Fragment key={`${part}-${index}`}>{part}</Fragment>
      ),
    );
  };

  const renderMessage = (text: string) => {
    const normalized = normalizeMessage(text);
    const lines = normalized
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const blocks: ReactNode[] = [];
    let listItems: ReactNode[] = [];

    const flushList = () => {
      if (listItems.length === 0) return;
      blocks.push(
        <ul key={`list-${blocks.length}`} className="ml-4 list-disc space-y-1 text-sm leading-relaxed">
          {listItems.map((item, index) => (
            <li key={`item-${index}`}>{item}</li>
          ))}
        </ul>,
      );
      listItems = [];
    };

    lines.forEach((line, index) => {
      const numberedMatch = line.match(/^\d+\.\s+(.*)$/);
      const bulletMatch = line.match(/^[-*]\s+(.*)$/);
      const headingMatch = line.match(/^\*\*(.+?)\*\*\s*:?\s*(.*)$/);

      if (numberedMatch || bulletMatch) {
        listItems.push(renderInline((numberedMatch?.[1] ?? bulletMatch?.[1]) as string));
        return;
      }

      flushList();

      if (headingMatch) {
        blocks.push(
          <p key={`heading-${index}`} className="text-sm font-semibold">
            {headingMatch[1]}
          </p>,
        );
        if (headingMatch[2]) {
          blocks.push(
            <p key={`heading-text-${index}`} className="text-sm leading-relaxed">
              {renderInline(headingMatch[2])}
            </p>,
          );
        }
        return;
      }

      blocks.push(
        <p key={`line-${index}`} className="text-sm leading-relaxed">
          {renderInline(line)}
        </p>,
      );
    });

    flushList();

    return <div className="space-y-2">{blocks}</div>;
  };

  const handleSend: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!userMessage.trim()) return;
    await sendMessage(userMessage);
    setUserMessage("");
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
        <header className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-black/60">Spontana AI</p>
          <h1 className="font-['Fraunces'] text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple Chat
          </h1>
        </header>

        <section className="flex flex-1 flex-col gap-4 rounded-3xl border border-black/10 bg-white p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between text-xs text-black/60">
            <span>Today - 2:15 PM</span>
            <span className="rounded-full bg-black px-2 py-0.5 uppercase tracking-[0.2em] text-white">
              Online
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-black/60">
            <span>Total tokens used: {totalTokensUsed}</span>
            {lastUsage && (
              <span>
                Last request: {lastUsage.prompt_tokens} in / {lastUsage.completion_tokens} out (
                {lastUsage.total_tokens} total)
              </span>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-auto pr-1">
            {msgs.length === 0 && !isLoading && (
              <p className="text-sm text-black/50">No messages yet. Say hello to start the chat.</p>
            )}
            {msgs.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                      isUser ? "bg-black text-white" : "border border-black/10 bg-white text-black"
                    }`}
                  >
                    {isUser ? msg.message : renderMessage(msg.message)}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/60">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form className="flex items-center gap-3 border-t border-black/10 pt-4" onSubmit={handleSend}>
            <input
              className="h-12 flex-1 rounded-full border border-black/15 bg-white px-4 text-sm text-black focus:border-black focus:outline-none focus:ring-2 focus:ring-black/20"
              placeholder="Write your message..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              disabled={isLoading}
            />
            <button
              className="h-12 rounded-full bg-black px-6 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isLoading || !userMessage.trim()}
            >
              Send
            </button>
            <button
              className="h-12 rounded-full border border-black/15 px-5 text-xs font-semibold text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={clearHistory}
              disabled={msgs.length === 0 || isLoading}
            >
              Clear
            </button>
          </form>
          {error && <p className="text-sm text-black/70">Error: {error}</p>}
        </section>
      </div>
    </div>
  );
}

export default App;
