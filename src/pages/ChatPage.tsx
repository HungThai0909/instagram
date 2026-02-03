import { useState, useEffect, useRef, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Edit2, Phone, Video, Info } from "lucide-react";
import axiosInstance from "@/services/axios";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

interface Participant {
  _id: string;
  username: string;
  fullName: string;
  profilePicture: string | null;
}

interface Conversation {
  _id: string;
  participants: Participant[];
  lastMessageAt: string;
  createdAt: string;
  unreadCount: number;
  lastMessage?: { content: string } | null;
}

interface MessageData {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture: string | null;
  };
  recipientId: string;
  messageType: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

function getMediaUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${axiosInstance.defaults.baseURL}${path}`;
}

function getOtherParticipant(
  conv: Conversation,
  currentUserId: string,
): Participant | null {
  return conv.participants.find((p) => p._id !== currentUserId) || null;
}

function formatTime(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), {
      locale: vi,
      addSuffix: true,
    });
  } catch {
    return "";
  }
}

function Avatar({ user, size = 44 }: { user: Participant; size?: number }) {
  const cls = `rounded-full object-cover flex-shrink-0`;
  if (user.profilePicture) {
    return (
      <img
        src={getMediaUrl(user.profilePicture)}
        alt={user.username}
        className={cls}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-white flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        className="text-black font-semibold uppercase"
        style={{ fontSize: size * 0.38 }}
      >
        {user.username[0]}
      </span>
    </div>
  );
}

export default function ChatPage() {
  const { user: currentUser } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const didFetchConvsRef = useRef(false);
  const location = useLocation();
  const initialConvId = location.state?.conversationId;

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConvs(true);
      const res = await axiosInstance.get("/api/messages/conversations");
      setConversations(res.data.data.conversations || []);
    } catch (err) {
      console.error("fetch conversations", err);
      toast.error("Không thể tải danh sách tin nhắn");
    } finally {
      setIsLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    if (didFetchConvsRef.current) return;
    didFetchConvsRef.current = true;

    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId: string) => {
    try {
      setIsLoadingMsgs(true);
      const res = await axiosInstance.get(
        `/api/messages/conversations/${convId}/messages`,
      );
      setMessages(res.data.data.messages || []);
    } catch (err) {
      console.error("fetch messages", err);
      toast.error("Không thể tải tin nhắn");
    } finally {
      setIsLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConv) fetchMessages(selectedConv._id);
  }, [selectedConv, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!initialConvId || conversations.length === 0) return;

    const found = conversations.find((c) => c._id === initialConvId);
    if (found) {
      setSelectedConv(found);
    }
  }, [initialConvId, conversations]);

  const handleSend = async () => {
    if (!input.trim() || !selectedConv || isSending) return;

    const otherUser = getOtherParticipant(selectedConv, currentUser?.id || "");
    if (!otherUser) return;

    try {
      setIsSending(true);
      const res = await axiosInstance.post("/api/messages/messages", {
        conversationId: selectedConv._id,
        recipientId: otherUser._id,
        messageType: "text",
        content: input.trim(),
      });

      setMessages((prev) => [...prev, res.data.data]);
      setInput("");

      fetchConversations();
    } catch (err) {
      console.error("send message", err);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setIsSending(false);
    }
  };

  const otherUser = selectedConv
    ? getOtherParticipant(selectedConv, currentUser?.id || "")
    : null;

  return (
    <div className="flex h-screen bg-black text-white">
      <div className="w-96 border-r border-gray-700 flex flex-col flex-shrink-0 bg-[#000]">
        <div className="flex items-center justify-between px-5 pt-6 pb-3">
          <h2 className="text-xl font-semibold">
            {currentUser?.username || "Tin nhắn"}
          </h2>
          <button className="text-white hover:opacity-70 cursor-pointer">
            <Edit2 className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-4">
          <input
            type="text"
            placeholder="Tìm kiếm"
            className="w-full bg-[#262626] rounded-lg px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600"
          />
        </div>

        <div className="px-5 pb-2">
          <p className="text-sm font-semibold text-white">Tin nhắn</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingConvs ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10 px-5">
              Chưa có cuộc trò chuyện nào
            </p>
          ) : (
            conversations.map((conv) => {
              const other = getOtherParticipant(conv, currentUser?.id || "");
              if (!other) return null;
              const isSelected = selectedConv?._id === conv._id;

              const lastText =
                conv.lastMessage?.content || "Bất đầu trò chuyện";

              return (
                <button
                  key={conv._id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full flex items-center gap-3 px-5 py-3 transition-colors cursor-pointer ${
                    isSelected ? "bg-[#1a1a1a]" : "hover:bg-[#111]"
                  }`}
                >
                  <Avatar user={other} size={44} />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {other.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {lastText}
                      {conv.lastMessageAt && (
                        <span className="ml-1">
                          · {formatTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-[#0095f6] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#000]">
        {selectedConv && otherUser ? (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Avatar user={otherUser} size={40} />
                <div>
                  <p className="text-sm font-semibold">{otherUser.fullName}</p>
                  <p className="text-xs text-gray-500">{otherUser.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-400">
                <button className="hover:text-white cursor-pointer">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="hover:text-white cursor-pointer">
                  <Video className="w-5 h-5" />
                </button>
                <button className="hover:text-white cursor-pointer">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {isLoadingMsgs ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
                  <Avatar user={otherUser} size={80} />
                  <p className="text-sm font-semibold">{otherUser.fullName}</p>
                  <p className="text-xs text-gray-500">
                    Bạn và {otherUser.username} không có tin nhắn nào. Bắt đầu
                    một cuộc trò chuyện mới!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId._id === currentUser?.id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-2xl ${
                          isOwn
                            ? "bg-[#0095f6] text-white rounded-br-sm"
                            : "bg-[#262626] text-white rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center gap-3 px-5 py-3 border-t border-gray-700 flex-shrink-0">
              <button className="text-[#0095f6] hover:opacity-70 cursor-pointer flex-shrink-0">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Nhập tin nhắn..."
                disabled={isSending}
                className="flex-1 bg-[#1a1a1a] rounded-full px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600 disabled:opacity-60"
              />

              {input.trim() && (
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="text-[#0095f6] text-sm font-semibold hover:opacity-70 cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  Gửi
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold">Tin nhắn của bạn</p>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                Gửi tin nhắn riêng hoặc chọn một cuộc trò chuyện để xem
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
