import { useState } from "react";
import {
  useConversationsQuery,
  useSendMessageMutation,
  useConversationMessagesQuery,
} from "@/hooks/useChatQuery";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

export default function ChatPage() {
  const { user: currentUser } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messageInput, setMessageInput] = useState("");

  const { data: conversationsData, isLoading: conversationsLoading } =
    useConversationsQuery({
      page: 1,
      limit: 20,
    });

  const { data: messagesData, isLoading: messagesLoading } =
    useConversationMessagesQuery(selectedConversationId || "", {
      page: 1,
      limit: 50,
    });

  const { mutate: sendMessage, isPending: isSending } =
    useSendMessageMutation();

  const conversations = conversationsData?.data || [];
  const messages = messagesData?.data || [];
  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId,
  );

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversationId) return;

    sendMessage({
      conversation_id: selectedConversationId,
      content: messageInput,
    });
    setMessageInput("");
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="w-96 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>
        <ScrollArea className="flex-1">
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No conversations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                    selectedConversationId === conversation.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {conversation.other_user?.avatar && (
                      <img
                        src={conversation.other_user.avatar}
                        alt={conversation.other_user.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {conversation.other_user?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conversation.last_message?.content}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-border flex items-center gap-3">
              {selectedConversation.other_user?.avatar && (
                <img
                  src={selectedConversation.other_user.avatar}
                  alt={selectedConversation.other_user.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold">
                  {selectedConversation.other_user?.full_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  @{selectedConversation.other_user?.username}
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender_id === currentUser?.id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.sender_id === currentUser?.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatDistanceToNow(new Date(message.created_at))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                  disabled={isSending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !messageInput.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              Select a conversation to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
