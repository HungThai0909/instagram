import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
  useParams,
} from "react-router-dom";
import { authService } from "@/services/authService";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token: urlToken } = useParams<{ token: string }>();
  const email = (location.state as any)?.email || "";
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string>("");

  useEffect(() => {
    const token = urlToken || searchParams.get("token");

    if (token) {
      console.log("Token found:", token);
      verifyWithToken(token);
    }
  }, [urlToken, searchParams]);

  const verifyWithToken = async (token: string) => {
    setIsVerifying(true);
    setVerifyError("");

    try {
      const response = await authService.verifyEmailWithToken(token);

      const verifiedEmail = response?.data?.user?.email || email;

      toast.success(
        "Email đã được xác thực! Đang chuyển đến trang đăng nhập...",
      );

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            verified: true,
            email: verifiedEmail,
          },
        });
      }, 1500);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Xác thực email thất bại";

      setVerifyError(errorMessage);
      toast.error(errorMessage);
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email không được tìm thấy. Vui lòng đăng ký lại.");
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

  const handleBackToLogin = () => {
    navigate("/login", { replace: true });
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

            {!isVerifying &&
              !verifyError &&
              !urlToken &&
              !searchParams.get("token") && (
                <>
                  <p className="text-gray-400 text-sm mt-3">
                    Chúng tôi đã gửi link xác thực đến email của bạn. Vui lòng
                    kiểm tra hộp thư để kích hoạt tài khoản.
                  </p>
                  {email && (
                    <p className="font-semibold text-sm mt-2 break-all text-gray-300">
                      {email}
                    </p>
                  )}
                </>
              )}
          </div>

          {isVerifying && (
            <div className="mt-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
              </div>
              <p className="text-white text-base font-semibold mb-2">
                Đang xác thực email của bạn...
              </p>
              <p className="text-gray-400 text-sm">
                Vui lòng đợi trong giây lát
              </p>
            </div>
          )}

          {verifyError && (
            <div className="mt-6 text-center">
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
                <p className="text-red-400 text-sm">{verifyError}</p>
              </div>

              <div className="space-y-3">
                {email && (
                  <button
                    onClick={handleResend}
                    disabled={isLoading}
                    className="w-full h-11 font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Đang gửi..." : "Gửi lại email xác thực"}
                  </button>
                )}

                <button
                  onClick={handleBackToLogin}
                  className="w-full h-11 font-semibold rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-base cursor-pointer"
                >
                  Quay lại đăng nhập
                </button>
              </div>
            </div>
          )}

          {!isVerifying &&
            !verifyError &&
            !urlToken &&
            !searchParams.get("token") && (
              <div className="mt-8 text-center text-sm">
                <p className="text-gray-400">
                  Không nhận được email?
                  <button
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer ml-1 disabled:opacity-50"
                  >
                    {isLoading ? "Đang gửi..." : "Gửi lại"}
                  </button>
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
