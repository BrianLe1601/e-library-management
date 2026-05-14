import { Mail } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function OtpVerification() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(59);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleResend = () => {
    setTimer(59);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Check your email</h1>
          <p className="text-gray-600">
            We sent a verification link and a 6-digit code to your email address{" "}
            <span className="font-semibold text-gray-900">example@gmail.com</span>
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-center font-medium text-gray-900 mb-4">
            Enter verification code
          </label>
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                aria-label={`OTP digit ${index + 1}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`h-14 w-14 rounded-lg border-2 text-center text-xl font-semibold transition-all focus:outline-none ${
                  index === 0 && !otp[0]
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : digit
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition-colors mb-6"
        >
          Verify Code
        </button>

        <div className="text-center">
          <p className="text-gray-600">
            Didn't receive the code?{" "}
            {timer > 0 ? (
              <span>
                Resend in <span className="font-semibold text-gray-900">00:{timer.toString().padStart(2, "0")}</span>
              </span>
            ) : (
              <button
                onClick={handleResend}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Resend
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
