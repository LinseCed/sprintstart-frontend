import { Bot, MessageSquareText, Plus, Send, Sparkles, User, X } from "lucide-react";
import { useChat } from "../features/chatbot/hooks/useChat.ts";
import ReactMarkdown from "react-markdown";
import { ChatSidebar } from "../features/chatbot/components/ChatSidebar.tsx";

/**
 * Displays the interface for communication with the chat.
 */
export function ChatPage() {
    const {
        messages,
        chatId,
        chats,
        handleSubmit,
        isThinking,
        newRequest,
        setNewRequest,
        selectedCitation,
        setSelectedCitation,
        sidebarOpen,
        setSidebarOpen,
    } = useChat();

    return (
        <div className="h-screen flex overflow-hidden bg-app-bg text-app-text">
            {chats?.length !== 0 && (
                <aside className="w-64 bg-app-bg border-r border-app-border md:flex flex-col shrink-0 hidden">
                    <ChatSidebar chats={chats} setSidebarOpen={setSidebarOpen} />
                </aside>
            )}

            <aside
                className={`
                    fixed top-0 left-0 h-full w-64 bg-app-bg
                    border-r border-app-border z-50
                    transform transition-transform duration-300
                    md:hidden
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                <div className="p-4 flex justify-between items-center">
                    <h2 className="font-bold">Chats</h2>

                    <button onClick={() => setSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <ChatSidebar chats={chats} setSidebarOpen={setSidebarOpen} />
            </aside>

            <button
                className="
                    fixed
                    top-4
                    right-4
                    z-50
                    md:hidden
                    p-3
                    text-white
                    rounded-full
                    bg-app-surface
                    border
                    border-app-border
                    shadow-lg
                    mt-15
                    hover:cursor-pointer
                "
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                <MessageSquareText size={24} />
            </button>

            <div className="flex flex-col flex-1 min-w-0">
                <header className="h-16 border-b border-app-border flex items-center px-6 shrink-0 bg-app-bg/80 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <Sparkles className="text-app-brand-text" size={20} />
                        <h1 className="font-bold text-app-text text-lg">AI Assistant</h1>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto flex flex-col">
                    {!chatId && (
                        <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
                            <div className="bg-app-brand-soft p-4 rounded-3xl mb-4">
                                <Bot className="text-app-brand-text size-12" />
                            </div>

                            <h1 className="text-app-text font-bold text-2xl mb-2">
                                How can I help you today?
                            </h1>

                            <p className="text-app-text-muted max-w-md text-sm">
                                Ask anything about your project&apos;s codebase, documentation, or
                                onboarding process.
                            </p>
                        </div>
                    )}

                    <div className="max-w-4xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
                        {messages.map((message, index) => {
                            const isRequest = message.role === "USER";

                            return (
                                <div
                                    key={index}
                                    className={`flex w-full gap-4 ${
                                        isRequest ? "flex-row-reverse" : "flex-row"
                                    }`}
                                >
                                    <div
                                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                            isRequest ? "bg-app-brand" : "bg-app-surface-muted"
                                        }`}
                                    >
                                        {isRequest ? (
                                            <User size={16} className="text-white" />
                                        ) : (
                                            <Bot size={16} className="text-app-brand-text" />
                                        )}
                                    </div>

                                    <div
                                        className={`flex flex-col max-w-[85%] ${
                                            isRequest ? "items-end" : "items-start"
                                        }`}
                                    >
                                        <div
                                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                                isRequest
                                                    ? "bg-app-brand text-white rounded-tr-none"
                                                    : "bg-app-surface-muted text-app-text rounded-tl-none"
                                            }`}
                                        >
                                            <ReactMarkdown>{message.content}</ReactMarkdown>

                                            {message.citations && message.citations.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-app-border-muted flex flex-wrap gap-1.5">
                                                    {message.citations.map((citation, cIdx) => (
                                                        <button
                                                            key={cIdx}
                                                            onClick={() =>
                                                                setSelectedCitation(citation)
                                                            }
                                                            className="text-[10px] bg-app-bg-soft hover:bg-app-surface text-app-brand-text px-2 py-0.5 rounded border border-app-brand-border transition-colors"
                                                        >
                                                            [{cIdx + 1}] {citation.filename}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {selectedCitation && (
                    <div className="absolute right-6 bottom-24 w-80 rounded-xl bg-app-surface border border-app-border p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-sm font-bold text-app-text truncate pr-4">
                                {selectedCitation.filename}
                            </h3>

                            <button
                                onClick={() => setSelectedCitation(null)}
                                className="text-app-text-muted hover:text-app-text transition-colors"
                            >
                                <Plus size={18} className="rotate-45" />
                            </button>
                        </div>

                        <div className="text-xs text-app-text line-clamp-4 leading-relaxed">
                            {selectedCitation.section_path}
                        </div>
                    </div>
                )}

                <footer className="p-4 bg-app-bg border-t border-app-border">
                    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3">
                        <input
                            type="text"
                            placeholder="Ask anything about the project..."
                            className="flex-1 px-4 py-2.5 rounded-xl text-app-text text-sm bg-app-surface-muted border border-app-border-muted placeholder:text-app-text-disabled outline-none focus:ring-2 focus:ring-app-focus/50 transition-all"
                            value={newRequest}
                            onChange={(e) => setNewRequest(e.currentTarget.value)}
                        />

                        <button
                            type="submit"
                            disabled={isThinking || !newRequest.trim()}
                            className="p-2.5 bg-app-brand text-white rounded-xl hover:bg-app-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
}
