import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/authService";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mật khẩu phải ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Phải có ít nhất 1 chữ hoa")
      .regex(/[a-z]/, "Phải có ít nhất 1 chữ thường")
      .regex(/[0-9]/, "Phải có ít nhất 1 chữ số")
      .regex(/[^A-Za-z0-9]/, "Phải có ít nhất 1 ký tự đặc biệt")
      .trim(),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const { token: pathToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

 
  const token = pathToken || searchParams.get("token") || "";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error("Token không hợp lệ");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.resetPassword(token, {
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      toast.success(res?.message || "Mật khẩu đã được đặt lại thành công");
      navigate("/login", { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đặt lại mật khẩu thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black items-center justify-center">
      
      <div className="w-full max-w-md px-6">
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-6">
            Đặt mật khẩu mới
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Mật khẩu mới"
                {...register("password")}
                disabled={isLoading}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-3 rounded-lg placeholder:text-gray-500 focus:border-gray-600 focus:outline-none"
              />
              {errors.password && (
                <p className="text-xs text-red-400 px-1 text-left">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Xác nhận mật khẩu"
                {...register("confirmPassword")}
                disabled={isLoading}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-3 rounded-lg placeholder:text-gray-500 focus:border-gray-600 focus:outline-none"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 px-1 text-left">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-base cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
