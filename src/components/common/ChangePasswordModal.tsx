import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axiosInstance from "@/services/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/authStore";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu cũ").trim(),
    newPassword: z
      .string()
      .min(6, "Mật khẩu phải ít nhất 6 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ viết hoa")
      .trim(),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới").trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [isChanging, setIsChanging] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, reset]);

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

  const onSubmit = async (data: ChangePasswordInput) => {
    try {
      setIsChanging(true);
      await axiosInstance.post("/api/auth/change-password", data);
      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      onClose();
      logout();
      localStorage.removeItem("auth_token");
      localStorage.removeItem("current_user");
      localStorage.removeItem("auth-storage");
      navigate("/login");
    } catch (error: any) {
      console.error("Failed to change password:", error);
      const errorMessage =
        error.response?.data?.message || "Không thể đổi mật khẩu";
      if (
        errorMessage.toLowerCase().includes("current password") ||
        errorMessage.toLowerCase().includes("mật khẩu cũ") ||
        errorMessage.toLowerCase().includes("incorrect")
      ) {
        setError("currentPassword", {
          type: "manual",
          message: "Mật khẩu cũ không đúng",
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsChanging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-[#262626] rounded-xl w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold flex-1 text-center">
            Đổi mật khẩu
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white cursor-pointer"
            disabled={isChanging}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold">Mật khẩu cũ</label>
            <Input
              type="password"
              placeholder="Nhập mật khẩu cũ"
              {...register("currentPassword")}
              disabled={isChanging}
              className={`bg-[#1a1a1a] border-gray-700 ${
                errors.currentPassword ? "border-red-500" : ""
              }`}
            />
            {errors.currentPassword && (
              <p className="text-red-500 text-xs">
                {errors.currentPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold">Mật khẩu mới</label>
            <Input
              type="password"
              placeholder="Nhập mật khẩu mới"
              {...register("newPassword")}
              disabled={isChanging}
              className={`bg-[#1a1a1a] border-gray-700 ${
                errors.newPassword ? "border-red-500" : ""
              }`}
            />
            {errors.newPassword && (
              <p className="text-red-500 text-xs">
                {errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold">
              Nhập lại mật khẩu mới
            </label>
            <Input
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              {...register("confirmPassword")}
              disabled={isChanging}
              className={`bg-[#1a1a1a] border-gray-700 ${
                errors.confirmPassword ? "border-red-500" : ""
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="flex-1 bg-transparent border border-gray-700 hover:bg-white/5 bg-white cursor-pointer"
              disabled={isChanging}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isChanging}
              className="flex-1 bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold disabled:opacity-50 cursor-pointer"
            >
              {isChanging ? "Đang đổi..." : "Đổi mật khẩu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
