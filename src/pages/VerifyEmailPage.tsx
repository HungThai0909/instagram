import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "@/services/authService";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = (location.state as any)?.email || "";
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
  const rawToken = searchParams.get("token");

  if (rawToken) {
    const decodedToken = decodeURIComponent(rawToken);
    verifyWithToken(decodedToken);
  }
}, [searchParams]);

  const verifyWithToken = async (token: string) => {
  setIsVerifying(true);
  try {
    await authService.verifyEmailWithToken(token);

    toast.success("Email đã được xác thực! Bạn có thể đăng nhập");

    navigate("/login", {
      replace: true,
      state: {
        verified: true,
        email, 
      },
    });
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Xác thực email thất bại");
  } finally {
    setIsVerifying(false);
  }
};

  const handleResend = async () => {
    if (!email) {
      toast.error("Email không được tìm thấy");
      return;
    }
    setIsLoading(true);
    try {
      await authService.resendVerification(email);
      toast.success("Mã xác thực đã được gửi lại đến email của bạn");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Gửi lại mã xác thực thất bại",
      );
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
          <div className="text-center mb-8">
            <h1
              className="text-6xl font-bold text-white mb-2"
              style={{ fontFamily: "cursive" }}
            >
              Instagram
            </h1>
            <p className="text-white font-semibold text-lg">Xác thực email</p>
            <p className="text-gray-400 text-sm mt-3">
              Chúng tôi đã gửi link xác thực đến email của bạn. Vui lòng kiểm
              tra hộp thư để kích hoạt tài khoản.
            </p>
            {email && (
              <p className="font-semibold text-sm mt-2 break-all text-gray-300">
                {email}
              </p>
            )}
          </div>

          <div className="mt-8 text-center text-sm">
            <p className="text-gray-400">
              Không nhận được email?
              <button
                onClick={handleResend}
                disabled={isLoading || isVerifying}
                className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer ml-1 disabled:opacity-50"
              >
                {isLoading ? "Đang gửi..." : "Gửi lại"}
              </button>
            </p>
          </div>

          {isVerifying && (
            <div className="mt-6 text-center">
              <div className="flex justify-center mb-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
              <p className="text-gray-400 text-sm">
                Đang xác thực email của bạn...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
