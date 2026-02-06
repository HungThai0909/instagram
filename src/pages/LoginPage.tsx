import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Địa chỉ email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu phải ít nhất 8 ký tự"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (location.state?.verified && location.state?.email) {
      toast.success("Email đã được xác thực, bạn có thể đăng nhập ");
      setValue("email", location.state.email);
    }
  }, [location.state, setValue]);

  const onSubmit = async (data: LoginInput) => {
    await login(data);
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

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit(onSubmit)();
              }
            }}
          >
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

            <Button
              type="submit"
              className="w-full h-11 font-bold rounded-lg mt-6 bg-blue-600 hover:bg-blue-700 text-white text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-xs text-gray-500 font-semibold">HOẶC</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          <Button
            variant="ghost"
            className="w-full h-10 font-semibold text-blue-400 hover:text-blue-300 hover:bg-transparent text-sm cursor-pointer"
            disabled={isLoading}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Đăng nhập bằng Facebook
          </Button>

          <div className="space-y-4 text-center">
            <p className="text-gray-400">
              <Link
                to="/forgot-password"
                className="text-white hover:text-gray-300 font-medium text-md"
              >
                Quên mật khẩu?
              </Link>
            </p>

            <p className="text-gray-400 text-sm mt-8">
              Bạn chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Đăng ký
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
