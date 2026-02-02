import { useEffect } from "react";
import type { OptionsModalProps } from "../../types";

export default function OptionsModal({
  isOpen,
  onClose,
  isOwn,
  onEdit,
  onDelete,
  onReport,
  type = "post",
}: OptionsModalProps) {
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

  if (!isOpen) return null;

  const deleteText = type === "post" ? "Xóa" : "Xóa bình luận";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-[#262626] rounded-xl w-full max-w-[400px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {isOwn ? (
          <>
            {onEdit && (
              <button
                onClick={() => {
                  onEdit();
                  onClose();
                }}
                className="w-full py-3.5 text-sm font-semibold hover:bg-white/5 transition border-b border-gray-700 cursor-pointer"
              >
                Chỉnh sửa
              </button>
            )}
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="w-full py-3.5 text-sm font-bold text-red-500 hover:bg-white/5 transition border-b border-gray-700 cursor-pointer"
            >
              {deleteText}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3.5 text-sm hover:bg-white/5 transition cursor-pointer"
            >
              Hủy
            </button>
          </>
        ) : (
          <>
            {onReport && (
              <button
                onClick={() => {
                  onReport();
                  onClose();
                }}
                className="w-full py-3.5 text-sm font-bold text-red-500 hover:bg-white/5 transition border-b border-gray-700 cursor-pointer"
              >
                Báo cáo
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-3.5 text-sm hover:bg-white/5 transition cursor-pointer"
            >
              Hủy
            </button>
          </>
        )}
      </div>
    </div>
  );
}
