import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosInstance from "@/services/axios";
import { toast } from "sonner";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const editProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Họ tên không được để trống")
    .max(50, "Họ tên tối đa 50 ký tự")
    .trim(),

  bio: z
    .string()
    .max(150, "Tiểu sử tối đa 150 ký tự")
    .optional()
    .or(z.literal("")),

  website: z.string().url("Website không hợp lệ").optional().or(z.literal("")),

  gender: z.enum(["male", "female", "other"]),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: "",
      bio: "",
      website: "",
      gender: "male",
    },
  });

  useEffect(() => {
    if (isOpen && profile) {
      reset({
        fullName: profile.fullName || "",
        bio: profile.bio || "",
        website: profile.website || "",
        gender: (profile.gender as any) || "male",
      });
      setPreviewImage(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, profile, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isOpen, onClose]);

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

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("profilePicture", file);

      await axiosInstance.patch("/api/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Đã đổi ảnh đại diện");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tải ảnh lên");
      setPreviewImage(null);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: EditProfileForm) => {
    try {
      await axiosInstance.patch("/api/users/profile", data);
      toast.success("Đã cập nhật thông tin");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể cập nhật thông tin",
      );
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

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto"
        >
          <div className="flex items-center gap-4 p-6 bg-[#1a1a1a]">
            <img
              src={displayImage}
              alt={profile.username}
              className="w-16 h-16 rounded-full object-cover"
            />

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
              className="bg-[#0095f6] hover:bg-[#1877f2] text-white text-sm font-semibold px-4 h-8 cursor-pointer"
            >
              {isUploadingImage ? "Đang tải..." : "Đổi ảnh"}
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Họ tên</label>
              <Input
                {...register("fullName")}
                className="bg-[#1a1a1a] border-gray-700"
              />
              {errors.fullName && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Tiểu sử
              </label>
              <textarea
                {...register("bio")}
                rows={3}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3"
              />
              {errors.bio && (
                <p className="text-xs text-red-400">{errors.bio.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Trang web
              </label>
              <Input
                {...register("website")}
                className="bg-[#1a1a1a] border-gray-700"
              />
              {errors.website && (
                <p className="text-xs text-red-400">{errors.website.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Giới tính
              </label>
              <select
                {...register("gender")}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg p-3"
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
              disabled={isSubmitting || isUploadingImage}
              className="w-full bg-[#363636] hover:bg-[#4a4a4a] text-white font-semibold h-10 cursor-pointer"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
