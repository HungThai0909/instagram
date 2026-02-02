import { useState, useEffect, useRef } from "react";
import { X, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/services/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostModal({
  isOpen,
  onClose,
}: CreatePostModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"select" | "preview">("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep("select");
      setSelectedFile(null);
      setPreview(null);
      setCaption("");
      setMediaType(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPosting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, isPosting]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Chỉ chấp nhận file ảnh hoặc video");
      return;
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Kích thước file không được vượt quá 50MB");
      return;
    }

    setSelectedFile(file);
    setMediaType(isImage ? "image" : "video");

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      setStep("preview");
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePost = async () => {
    if (!selectedFile) return;

    try {
      setIsPosting(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }

      await axiosInstance.post("/api/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Đã đăng bài viết");

      queryClient.invalidateQueries({ queryKey: ["posts"] });

      onClose();

      navigate("/");
    } catch (error: any) {
      console.error("Failed to create post:", error);
      toast.error(error.response?.data?.message || "Không thể đăng bài viết");
    } finally {
      setIsPosting(false);
    }
  };

  const handleBack = () => {
    setStep("select");
    setSelectedFile(null);
    setPreview(null);
    setCaption("");
    setMediaType(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80"
      onClick={!isPosting ? onClose : undefined}
    >
      <div
        className="bg-[#262626] rounded-xl w-full max-w-3xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {step === "preview" && (
            <button
              onClick={handleBack}
              disabled={isPosting}
              className="text-sm font-semibold cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
          )}
          <h2 className="text-base font-semibold flex-1 text-center">
            {step === "select" ? "Tạo bài viết mới" : "Tạo bài viết mới"}
          </h2>
          {step === "preview" ? (
            <button
              onClick={handlePost}
              disabled={isPosting}
              className="text-sm font-semibold text-[#0095f6] cursor-pointer disabled:opacity-50"
            >
              {isPosting ? "Đang đăng..." : "Đăng"}
            </button>
          ) : (
            <button
              onClick={onClose}
              disabled={isPosting}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {step === "select" ? (
          <div className="flex flex-col items-center justify-center p-12 min-h-[500px]">
            <p className="text-xl font-light mb-6">Tải ảnh và video vào đây</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <Button
              onClick={handleFileSelect}
              className="bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold px-6 py-2 rounded-lg cursor-pointer"
            >
              Chọn từ máy tính
            </Button>
          </div>
        ) : (
          <div className="flex">
            <div className="flex-1 bg-black flex items-center justify-center min-h-[500px]">
              {mediaType === "image" ? (
                <img
                  src={preview || ""}
                  alt="Preview"
                  className="max-w-full max-h-[500px] object-contain"
                />
              ) : (
                <video
                  src={preview || ""}
                  controls
                  className="max-w-full max-h-[500px]"
                />
              )}
            </div>

            <div className="w-80 border-l border-gray-700 flex flex-col">
              <div className="p-4">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Viết chú thích..."
                  disabled={isPosting}
                  className="w-full bg-transparent border-none text-sm resize-none focus:outline-none placeholder:text-gray-500 h-32"
                  maxLength={2200}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
