import {NavLink} from "react-router-dom";
import {Plus} from "lucide-react";
import type {ChatSidebarProps} from "../../types/chatTypes";

export function ChatSidebar( { chats, setSidebarOpen } : ChatSidebarProps) {

    return (
        <div className="flex flex-col gap-4 p-4 overflow-y-auto">

        <NavLink
            to="/chat"
            className="bg-blue-600 rounded-lg hover:bg-blue-700 flex justify-center gap-2 items-center text-sm font-semibold p-2.5 text-white transition shadow-sm"
            onClick={() => setSidebarOpen(false)}
        >
            <Plus size={18} />
            New Chat
        </NavLink>

        <div className="flex flex-col gap-1">
            <p className="text-gray-400 px-2 py-1 text-xs font-bold uppercase tracking-wider">
                Recent Chats
            </p>

            {chats.map((chat) => (
                <NavLink
                    key={chat.id}
                    to={`/chat/${chat.id}`}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `
                                        group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                                        ${isActive ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"}
                                    `}
                >
                    {chat.title ?
                        <div className="truncate flex-1">
                            {chat.title}
                        </div> :
                        <div className="truncate flex-1 italic">
                            waiting for title...
                        </div>
                    }

                </NavLink>
            ))}
        </div>
    </div>
    )
}