import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosInstance from "@/services/axios";
import { toast } from "sonner";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    username: string;
    fullName: string;
    bio: string;
    website: string;
    gender: string;
    profilePicture?: string | null;
  };
  onSuccess: () => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onSuccess,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    website: "",
    gender: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        fullName: profile.fullName || "",
        bio: profile.bio || "",
        website: profile.website || "",
        gender: profile.gender || "male",
      });
      setPreviewImage(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, profile]);

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (jpg, jpeg, png, gif)");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("profilePicture", file);

      await axiosInstance.patch("/api/users/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Đã đổi ảnh đại diện");
      onSuccess();
    } catch (error: any) {
      console.error("Failed to upload image:", error);
      toast.error(error.response?.data?.message || "Không thể tải ảnh lên");
      setPreviewImage(null);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      await axiosInstance.patch("/api/users/profile", formData);
      toast.success("Đã cập nhật thông tin");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(
        error.response?.data?.message || "Không thể cập nhật thông tin",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getMediaUrl = (path?: string | null) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("//")) return path;
    return `${axiosInstance.defaults.baseURL}${path}`;
  };

  const displayImage = previewImage || getMediaUrl(profile.profilePicture);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-[#262626] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold flex-1 text-center">
            Chỉnh sửa trang cá nhân
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white cursor-pointer"
            disabled={isUploadingImage}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="flex items-center gap-4 p-6 bg-[#1a1a1a]">
            {displayImage ? (
              <div className="relative">
                <img
                  src={displayImage}
                  alt={profile.username}
                  className="w-16 h-16 rounded-full object-cover"
                />
                {isUploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center relative">
                <span className="text-black font-semibold text-xl uppercase">
                  {profile.username[0]}
                </span>
                {isUploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold">{profile.username}</p>
              <p className="text-sm text-gray-400">{profile.fullName}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif"
              onChange={handleImageChange}
              className="hidden"
              disabled={isUploadingImage}
            />
            <Button
              type="button"
              onClick={handleImageClick}
              disabled={isUploadingImage}
              className="bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold px-4 h-8 disabled:opacity-50 cursor-pointer"
            >
              {isUploadingImage ? "Đang tải..." : "Đổi ảnh"}
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Họ tên</label>
              <Input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="bg-[#1a1a1a] border-gray-700 focus:border-gray-500"
                disabled={isSaving || isUploadingImage}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Tiểu sử
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Tiểu sử"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-gray-500"
                disabled={isSaving || isUploadingImage}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Trang web
              </label>
              <Input
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="Website"
                className="bg-[#1a1a1a] border-gray-700 focus:border-gray-500"
                disabled={isSaving || isUploadingImage}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Giới tính
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-gray-500 cursor-pointer"
                disabled={isSaving || isUploadingImage}
              >
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>
          <div className="p-6 border-t border-gray-700">
            <Button
              type="submit"
              disabled={isSaving || isUploadingImage}
              className="w-full bg-[#363636] hover:bg-[#4a4a4a] text-white font-semibold h-10 rounded-lg disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
