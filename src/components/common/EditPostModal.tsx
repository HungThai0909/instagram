import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/services/axios";
import { toast } from "sonner";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  initialCaption: string;
  onSuccess: () => void;
}

export default function EditPostModal({
  isOpen,
  onClose,
  postId,
  initialCaption,
  onSuccess,
}: EditPostModalProps) {
  const [caption, setCaption] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCaption(initialCaption);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialCaption]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, isSaving]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await axiosInstance.patch(`/api/posts/${postId}`, {
        caption: caption.trim(),
      });
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Failed to update post:", error);
      toast.error(
        error.response?.data?.message || "Không thể cập nhật bài viết",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80"
      onClick={!isSaving ? onClose : undefined}
    >
      <div
        className="bg-[#262626] rounded-xl w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-base font-semibold flex-1 text-center">
            Chỉnh sửa tiêu đề
          </h2>
        </div>

        <div className="p-4">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-gray-500"
            rows={6}
            maxLength={2200}
            disabled={isSaving}
            autoFocus
          />
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-700">
          <Button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 bg-transparent border border-gray-700 hover:bg-white/5 text-white cursor-pointer disabled:opacity-50"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </div>
    </div>
  );
}
