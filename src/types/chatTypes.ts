export type Chat = {
    id: string;
    title: string;
    userId: string;
    createdAt: string;
};

export type ChatMessage = {
    id: string;
    role: 'ASSISTANT' | 'USER' | 'SYSTEM' | 'ORCHESTRATOR';
    chat: Chat | undefined,
    content: string;
    citations?: Citation[]
};

export type Citation = {
    chunk_id: string,
    filename: string,
    section_path: string
};

export type ChatSidebarProps = {
    chats: Chat[]
    setSidebarOpen: (open: boolean) => void;
};