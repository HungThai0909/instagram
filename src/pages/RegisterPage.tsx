import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/authService";
import { toast } from "sonner";

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, {
        message: "Email không được để trống",
      })
      .pipe(
        z.email({
          message: "Email không đúng định dạng",
        }),
      ),
    fullName: z.string().min(2, "Tên phải ít nhất 2 ký tự").trim(),
    username: z
      .string()
      .trim()
      .min(3, "Tên người dùng phải ít nhất 3 ký tự")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Tên người dùng không được chứa dấu tiếng Việt hoặc ký tự đặc biệt",
      ),
    password: z
      .string()
      .min(8, "Mật khẩu phải ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Phải có ít nhất 1 chữ hoa")
      .regex(/[a-z]/, "Phải có ít nhất 1 chữ thường")
      .regex(/[0-9]/, "Phải có ít nhất 1 chữ số")
      .regex(/[^A-Za-z0-9]/, "Phải có ít nhất 1 ký tự đặc biệt")
      .trim(),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu").trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const body = {
        email: data.email,
        username: data.username,
        password: data.password,
        confirmPassword: data.confirmPassword,
        fullName: data.fullName,
      };

      const res = await authService.register(body as any);
      toast.success(
        res?.message ||
          "Đăng ký thành công. Vui lòng kiểm tra email để xác thực.",
      );

      navigate("/verify-email", { state: { email: data.email } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black">
      <div className="hidden lg:flex flex-1 items-center justify-center bg-black relative overflow-hidden">
        <div className="flex items-center justify-center">
          <img
            src="/login.png"
            alt="Instagram"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 bg-black">
        <div className="w-full max-w-sm">
          <div className="text-center mb-16">
            <h1
              className="text-6xl font-bold text-white mb-2"
              style={{ fontFamily: "cursive" }}
            >
              Instagram
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder="Email"
                {...register("email")}
                disabled={isLoading}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm px-4 py-3 rounded-lg placeholder:text-gray-500 focus:border-gray-600 focus:outline-none"
              />
              {errors.email && (
                <p className="text-xs text-red-400 px-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="username"
                type="text"
                placeholder="Tên người dùng"
                {...register("username")}
                disabled={isLoading}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm px-4 py-3 rounded-lg placeholder:text-gray-500 focus:border-gray-600 focus:outline-none"
              />
              {errors.username && (
                <p className="text-xs text-red-400 px-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="fullName"
                type="text"
                placeholder="Họ và tên"
                {...register("fullName")}
                disabled={isLoading}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm px-4 py-3 rounded-lg placeholder:text-gray-500 focus:border-gray-600 focus:outline-none"
              />
              {errors.fullName && (
                <p className="text-xs text-red-400 px-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                {...register("password")}
                disabled={isLoading}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm px-4 py-3 rounded-lg placeholder:text-gray-500 focus:border-gray-600 focus:outline-none"
              />
              {errors.password && (
                <p className="text-xs text-red-400 px-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Xác nhận mật khẩu"
                {...register("confirmPassword")}
                disabled={isLoading}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm px-4 py-3 rounded-lg placeholder:text-gray-500 focus:border-gray-600 focus:outline-none"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 px-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-gray-400 hover:text-gray-300 cursor-pointer"
            >
              {showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
            </button>

            <Button
              type="submit"
              className="w-full h-11 font-bold rounded-lg mt-6 bg-blue-600 hover:bg-blue-700 text-white text-base cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Đăng ký"}
            </Button>
          </form>

          <div className="space-y-4 text-center">
            <p className="text-gray-400 text-sm mt-8">
              Bạn đã có tài khoản?{" "}
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 font-semibold "
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
