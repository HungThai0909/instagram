import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";
import { useChatStore } from "@/stores/chatStore";
import type { CreateMessageRequest, PaginationParams } from "@/types";
import { toast } from "sonner";

export function useConversationsQuery(params: PaginationParams) {
  const setConversations = useChatStore((state) => state.setConversations);

  return useQuery({
    queryKey: ["conversations", params.page],
    queryFn: async () => {
      const data = await chatService.getConversations(params);
      setConversations(data.data);
      return data;
    },
  });
}

export function useConversationQuery(conversationId: string) {
  const setCurrentConversation = useChatStore(
    (state) => state.setCurrentConversation,
  );

  return useQuery({
    queryKey: ["conversations", conversationId],
    queryFn: async () => {
      const data = await chatService.getConversation(conversationId);
      setCurrentConversation(data);
      return data;
    },
    enabled: !!conversationId,
  });
}

export function useConversationMessagesQuery(
  conversationId: string,
  params: PaginationParams,
) {
  const setMessages = useChatStore((state) => state.setMessages);

  return useQuery({
    queryKey: ["conversations", conversationId, "messages", params.page],
    queryFn: async () => {
      const data = await chatService.getMessages(conversationId, params);
      if (params.page === 1) {
        setMessages(data.data);
      }
      return data;
    },
    enabled: !!conversationId,
  });
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();
  const appendMessage = useChatStore((state) => state.appendMessage);

  return useMutation({
    mutationFn: (data: CreateMessageRequest) => chatService.sendMessage(data),
    onSuccess: (message) => {
      appendMessage(message);
      queryClient.invalidateQueries({
        queryKey: ["conversations", message.conversation_id, "messages"],
      });
    },
    onError: () => {
      toast.error("Failed to send message");
    },
  });
}

export function useMarkMessageAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => chatService.markMessageAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useStartConversationMutation() {
  const queryClient = useQueryClient();
  const appendConversation = useChatStore((state) => state.appendConversation);

  return useMutation({
    mutationFn: (userId: string) => chatService.startConversation(userId),
    onSuccess: (conversation) => {
      appendConversation(conversation);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => {
      toast.error("Failed to start conversation");
    },
  });
}

export function useDeleteConversationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      chatService.deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Conversation deleted");
    },
    onError: () => {
      toast.error("Failed to delete conversation");
    },
  });
}
