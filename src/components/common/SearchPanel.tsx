import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import axiosInstance from "@/services/axios";
import { toast } from "sonner";

interface SearchUser {
  _id: string;
  username?: string;
  fullName?: string;
  profilePicture?: string | null;
}

interface HistoryItem {
  _id: string;
  searchedUserId?: {
    _id: string;
    username?: string;
    fullName?: string;
    profilePicture?: string | null;
  };
}

interface SearchPanelProps {
  onClose: () => void;
}

export default function SearchPanel({ onClose }: SearchPanelProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didFetchRef = useRef(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const getMediaUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${axiosInstance.defaults.baseURL}${path}`;
  };

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/api/search-history");
      setHistory(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  }, []);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    fetchHistory();
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [fetchHistory]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await axiosInstance.get("/api/users/search", {
          params: { q: query.trim() },
        });
        setSearchResults(res.data.data || []);
        setShowResults(true);
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
  }, [query]);

  const handleUserClick = async (user: SearchUser) => {
    try {
      if (user._id && query.trim()) {
        await axiosInstance.post("/api/search-history", {
          searchedUserId: user._id,
          searchQuery: query.trim(),
        });
      }
    } catch (error) {
      console.error("Failed to save history:", error);
    }
    onClose();
    navigate(`/user/${user._id}`);
  };

  const handleHistoryClick = (item: HistoryItem) => {
    if (!item.searchedUserId?._id) return;
    onClose();
    navigate(`/user/${item.searchedUserId._id}`);
  };

  const handleDeleteOne = async (e: React.MouseEvent, historyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await axiosInstance.delete(`/api/search-history/${historyId}`);
      setHistory((prev) => prev.filter((h) => h._id !== historyId));
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Không thể xóa");
    }
  };

  const handleClearAll = async () => {
    try {
      await axiosInstance.delete("/api/search-history");
      setHistory([]);
    } catch (error) {
      console.error("Failed to clear all:", error);
      toast.error("Không thể xóa lịch sử");
    }
  };

  const renderAvatar = (user?: {
    username?: string;
    profilePicture?: string | null;
  }) => {
    const initial = user?.username?.charAt(0)?.toUpperCase() || "?";

    return (
      <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden">
        {user?.profilePicture ? (
          <img
            src={getMediaUrl(user.profilePicture)}
            alt={user.username || "user"}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
            <span className="text-black text-sm font-semibold">{initial}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-96 h-full border-r border-gray-700 bg-[#1a1a1a] flex flex-col py-8 px-5 flex-shrink-0">
      <h2 className="text-xl font-semibold text-white mb-5">Tìm kiếm</h2>

      <div className="relative mb-5">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm"
          className="w-full bg-[#262626] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600 pr-8"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setSearchResults([]);
              setShowResults(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showResults && query.trim() && (
        <div className="flex-1 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              Không tìm thấy kết quả
            </p>
          ) : (
            <div className="space-y-1">
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserClick(user)}
                  className="w-full flex items-center gap-3 px-2 py-2 hover:bg-[#262626] rounded-lg cursor-pointer transition-colors"
                >
                  {renderAvatar(user)}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-white">
                      {user.username || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.fullName || ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!query.trim() && history.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-white">Gần đây</p>
            <button
              onClick={handleClearAll}
              className="text-xs text-[#0095f6] hover:text-[#1877f2] cursor-pointer font-semibold"
            >
              Xóa tất cả
            </button>
          </div>

          <div className="space-y-1">
            {history.map((item) =>
              item.searchedUserId ? (
                <div
                  key={item._id}
                  onClick={() => handleHistoryClick(item)}
                  className="flex items-center gap-3 px-2 py-2 group hover:bg-[#262626] rounded-lg cursor-pointer transition-colors"
                >
                  {renderAvatar(item.searchedUserId)}

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {item.searchedUserId.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.searchedUserId.fullName}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDeleteOne(e, item._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}
    </div>
  );
}
