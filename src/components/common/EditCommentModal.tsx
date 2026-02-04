import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (newContent: string) => void;
  isSaving: boolean;
}

export default function EditCommentModal({
  isOpen,
  onClose,
  initialContent,
  onSave,
  isSaving,
}: EditCommentModalProps) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialContent]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60"
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return; 
        if (!isSaving) onClose();
      }}
    >
      <div
        className="bg-[#262626] rounded-xl w-full max-w-[500px] overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Chỉnh sửa bình luận</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent border border-gray-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-gray-500"
            rows={4}
            placeholder="Nhập nội dung bình luận..."
            disabled={isSaving}
          />
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-700">
          <Button
            onClick={onClose}
            variant="ghost"
            className="hover:bg-white/5 cursor-pointer"
            disabled={isSaving}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
            disabled={!content.trim() || isSaving}
          >
            {isSaving ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </div>
    </div>
  );
}
