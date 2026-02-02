import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/authService";
import { toast } from "sonner";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(data);
      toast.success(
        res?.message || "Email reset mật khẩu đã được gửi thành công",
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gửi email reset thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-6">Quên mật khẩu</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder="Email"
                {...register("email")}
                disabled={isLoading}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-3 rounded-lg placeholder:text-gray-500 focus:border-gray-600 focus:outline-none"
              />
              {errors.email && (
                <p className="text-xs text-red-400 px-1 text-left">
                  {errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-base cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Đang gửi..." : "Gửi email reset"}
            </Button>
          </form>

          <div className="mt-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="w-full text-blue-400 hover:text-blue-300 hover:bg-transparent font-semibold text-sm cursor-pointer"
              disabled={isLoading}
            >
              Quay lại đăng nhập
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
