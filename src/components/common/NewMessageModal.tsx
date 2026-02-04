import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import axiosInstance from "@/services/axios";
import { toast } from "sonner";

interface SearchUser {
  _id: string;
  username: string;
  fullName: string;
  profilePicture?: string | null;
}

interface HistoryItem {
  _id: string;
  searchedUserId: {
    _id: string;
    username: string;
    fullName: string;
    profilePicture?: string | null;
  };
}

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export default function NewMessageModal({
  isOpen,
  onClose,
  onConversationCreated,
}: NewMessageModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const getMediaUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${axiosInstance.defaults.baseURL}${path}`;
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchHistory = async () => {
      try {
        const res = await axiosInstance.get("/api/search-history", {
          params: { limit: 20 },
        });
        setHistory(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };

    fetchHistory();
    setQuery("");
    setSearchResults([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await axiosInstance.get("/api/users/search", {
          params: { q: query.trim() },
        });
        setSearchResults(res.data.data || []);
      } catch (error) {
        console.error("Failed to search:", error);
        toast.error("Không thể tìm kiếm");
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, isOpen]);

  const handleSelectUser = async (userId: string) => {
    try {
      const res = await axiosInstance.post("/api/messages/conversations", {
        userId,
      });

      const conversationId = res.data.data._id;

      onClose();
      onConversationCreated(conversationId);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      toast.error("Không thể tạo cuộc trò chuyện");
    }
  };

  const renderAvatar = (user: {
    username: string;
    profilePicture?: string | null;
  }) => (
    <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden">
      {user.profilePicture ? (
        <img
          src={getMediaUrl(user.profilePicture)}
          alt={user.username}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <span className="text-black text-sm font-semibold uppercase">
            {user.username[0]}
          </span>
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60" onClick={onClose} />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-full max-w-md bg-[#262626] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h2 className="text-base font-semibold text-white flex-1 text-center">
            Tin nhắn mới
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Tới:</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {query.trim() && (
            <div>
              {isSearching ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  Không tìm thấy kết quả
                </p>
              ) : (
                <div>
                  {searchResults.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleSelectUser(user._id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                    >
                      {renderAvatar(user)}
                      <div className="flex-1 text-left">
                        <p className="text-sm font-semibold text-white">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500">{user.fullName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!query.trim() && history.length > 0 && (
            <div>
              <div className="px-4 py-2">
                <p className="text-sm font-semibold text-white">Gợi ý</p>
              </div>
              <div>
                {history.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleSelectUser(item.searchedUserId._id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] cursor-pointer transition-colors"
                  >
                    {renderAvatar(item.searchedUserId)}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-white">
                        {item.searchedUserId.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.searchedUserId.fullName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
