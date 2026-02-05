import { useState, useEffect, useRef, useCallback } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";
import { Edit2, Phone, Video, Info, X } from "lucide-react";
import axiosInstance from "@/services/axios";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import NewMessageModal from "@/components/common/NewMessageModal";
import io, { Socket } from "socket.io-client";

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

function groupMessagesByDate(messages: MessageData[]) {
  const groups: { date: string; messages: MessageData[] }[] = [];
  let currentDate = "";
  let currentGroup: MessageData[] = [];

  messages.forEach((msg) => {
    const msgDate = format(new Date(msg.createdAt), "dd/MM/yyyy");
    if (msgDate !== currentDate) {
      if (currentGroup.length > 0) {
        groups.push({ date: currentDate, messages: currentGroup });
      }
      currentDate = msgDate;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  });

  if (currentGroup.length > 0) {
    groups.push({ date: currentDate, messages: currentGroup });
  }

  return groups;
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
  const currentUserId =
    (currentUser as any)?._id ?? (currentUser as any)?.id ?? "";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const didFetchConvsRef = useRef(false);
  const markedAsReadRef = useRef<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const selectedConvRef = useRef<Conversation | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const initialConvId = location.state?.conversationId;

  const [newMessageModal, setNewMessageModal] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    selectedConvRef.current = selectedConv;
  }, [selectedConv]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const socket = io("https://instagram.f8team.dev", {
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("Connected to chat server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from chat server");
    });

    socket.on("new_message", (message: MessageData) => {
      const currentConv = selectedConvRef.current;

      if (currentConv && message.conversationId === currentConv._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }

      fetchConversations();
      fetchUnreadCount();
    });

    socket.on("user_typing", ({ conversationId, userId }) => {
      const currentConv = selectedConvRef.current;

      if (
        currentConv &&
        conversationId === currentConv._id &&
        userId !== currentUserId
      ) {
        setIsTyping(true);
      }
    });

    socket.on("user_stop_typing", ({ conversationId, userId }) => {
      const currentConv = selectedConvRef.current;

      if (
        currentConv &&
        conversationId === currentConv._id &&
        userId !== currentUserId
      ) {
        setIsTyping(false);
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (!socketRef.current || !selectedConv) return;

    const otherUser = getOtherParticipant(selectedConv, currentUserId);
    if (!otherUser) return;

    socketRef.current.emit("typing", {
      conversationId: selectedConv._id,
      recipientId: otherUser._id,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.emit("stop_typing", {
          conversationId: selectedConv._id,
          recipientId: otherUser._id,
        });
      }
    }, 2000);
  };

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/messages/unread-count");
      setTotalUnreadCount(res.data.data.unreadCount || 0);
    } catch (err) {
      console.error("fetch unread count", err);
    }
  }, []);

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
    fetchUnreadCount();
  }, [fetchConversations, fetchUnreadCount]);

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
    if (selectedConv) {
      fetchMessages(selectedConv._id);
      markedAsReadRef.current.clear();
      setIsTyping(false);
    }
  }, [selectedConv, fetchMessages]);

  useEffect(() => {
    if (!selectedConv || !currentUser || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (msg) =>
        !msg.isRead &&
        msg.senderId._id !== currentUserId &&
        !markedAsReadRef.current.has(msg._id),
    );

    if (unreadMessages.length === 0) return;

    const markAsRead = async () => {
      for (const msg of unreadMessages) {
        try {
          await axiosInstance.put(`/api/messages/messages/${msg._id}/read`);
          markedAsReadRef.current.add(msg._id);

          setMessages((prev) =>
            prev.map((m) => (m._id === msg._id ? { ...m, isRead: true } : m)),
          );
        } catch (err) {
          console.error("Failed to mark message as read:", msg._id, err);
        }
      }

      fetchConversations();
      fetchUnreadCount();
    };

    const timer = setTimeout(markAsRead, 500);
    return () => clearTimeout(timer);
  }, [
    messages,
    selectedConv,
    currentUser,
    fetchConversations,
    fetchUnreadCount,
  ]);

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

  const handleConversationCreated = async (conversationId: string) => {
    await fetchConversations();
    const conv = conversations.find((c) => c._id === conversationId);
    if (conv) {
      setSelectedConv(conv);
    } else {
      const res = await axiosInstance.get("/api/messages/conversations");
      const allConvs = res.data.data.conversations || [];
      setConversations(allConvs);
      const found = allConvs.find((c: any) => c._id === conversationId);
      if (found) setSelectedConv(found);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || !selectedConv || isSending) return;

    const otherUser = getOtherParticipant(selectedConv, currentUserId);
    if (!otherUser) return;

    if (socketRef.current) {
      socketRef.current.emit("stop_typing", {
        conversationId: selectedConv._id,
        recipientId: otherUser._id,
      });
    }

    try {
      setIsSending(true);

      if (selectedImage) {
        const formData = new FormData();
        formData.append("file", selectedImage);
        formData.append("conversationId", selectedConv._id);
        formData.append("recipientId", otherUser._id);
        formData.append("messageType", "image");

        const res = await axiosInstance.post(
          "/api/messages/messages",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );

        setMessages((prev) => [...prev, res.data.data]);
        setSelectedImage(null);
        setImagePreview(null);
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
      } else {
        const res = await axiosInstance.post("/api/messages/messages", {
          conversationId: selectedConv._id,
          recipientId: otherUser._id,
          messageType: "text",
          content: input.trim(),
        });

        setMessages((prev) => [...prev, res.data.data]);
      }

      setInput("");
      fetchConversations();
      fetchUnreadCount();
    } catch (err) {
      console.error("send message", err);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setIsSending(false);
    }
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh");
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Kích thước ảnh không được vượt quá 10MB");
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const otherUser = selectedConv
    ? getOtherParticipant(selectedConv, currentUserId)
    : null;

  return (
    <div className="flex h-screen bg-black text-white">
      <div className="w-96 border-r border-gray-700 flex flex-col flex-shrink-0 bg-[#000]">
        <div className="flex items-center justify-between px-5 pt-6 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">
              {currentUser?.username || "Tin nhắn"}
            </h2>
            {totalUnreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setNewMessageModal(true)}
            className="text-white hover:opacity-70 cursor-pointer"
          >
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
              const other = getOtherParticipant(conv, currentUserId);
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
                  <p className="text-xs text-gray-500">
                    {isTyping ? "Đang nhập..." : otherUser.username}
                  </p>
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

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {isLoadingMsgs ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <Avatar user={otherUser} size={80} />
                  <p className="text-sm font-semibold">{otherUser.fullName}</p>
                  <p className="text-xs text-gray-500 text-center">
                    Bạn và {otherUser.username} không có tin nhắn nào. Bắt đầu
                    một cuộc trò chuyện mới!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupMessagesByDate(messages).map((group, groupIdx) => (
                    <div key={groupIdx}>
                      <div className="flex items-center justify-center mb-4">
                        <div className="bg-[#262626] px-3 py-1 rounded-full">
                          <p className="text-xs text-gray-400">{group.date}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {group.messages.map((msg) => {
                          const isOwn = msg.senderId._id === currentUserId;
                          return (
                            <div
                              key={msg._id}
                              className={`flex ${
                                isOwn ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-xs px-4 py-2 rounded-2xl ${
                                  isOwn
                                    ? "bg-[#0095f6] text-white rounded-br-sm"
                                    : "bg-[#262626] text-white rounded-bl-sm"
                                }`}
                              >
                                {msg.messageType === "image" && msg.content ? (
                                  <img
                                    src={getMediaUrl(msg.content)}
                                    alt="message"
                                    className="max-w-full rounded-lg"
                                  />
                                ) : (
                                  <p className="text-sm break-words">
                                    {msg.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-700 flex-shrink-0">
              {imagePreview && (
                <div className="px-5 pt-3">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="max-w-xs max-h-40 rounded-lg"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-[#262626] rounded-full p-1 hover:bg-[#363636] cursor-pointer"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 px-5 py-3">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isSending}
                />

                <button
                  onClick={handleImageClick}
                  disabled={isSending}
                  className="text-[#0095f6] hover:opacity-70 cursor-pointer flex-shrink-0 disabled:opacity-50"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
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

                <button
                  onClick={handleSend}
                  disabled={isSending || (!input.trim() && !selectedImage)}
                  className="text-[#0095f6] text-sm font-semibold hover:opacity-70 cursor-pointer disabled:opacity-50 flex-shrink-0"
                >
                  Gửi
                </button>
              </div>
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
                Gửi ảnh và tin nhắn riêng tư cho bạn bè hoặc nhóm
              </p>
              <button
                onClick={() => setNewMessageModal(true)}
                className="mt-2 bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer"
              >
                Gửi tin nhắn
              </button>
            </div>
          </div>
        )}
      </div>

      <NewMessageModal
        isOpen={newMessageModal}
        onClose={() => setNewMessageModal(false)}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}
