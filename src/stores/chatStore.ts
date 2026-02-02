import { create } from "zustand";
import type { Conversation, Message } from "@/types";

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  setConversations: (conversations: Conversation[]) => void;
  appendConversation: (conversation: Conversation) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  appendMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  setConversations: (conversations) => set({ conversations }),
  appendConversation: (conversation) =>
    set((state) => ({
      conversations: [
        conversation,
        ...state.conversations.filter((c) => c.id !== conversation.id),
      ],
    })),
  setCurrentConversation: (currentConversation) => set({ currentConversation }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      isLoading: false,
    }),
}));
