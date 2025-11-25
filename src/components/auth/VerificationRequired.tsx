import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "~/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

interface VerificationRequiredProps {
  userEmail: string;
}

export function VerificationRequired({ userEmail }: VerificationRequiredProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  const verifyEmail = useMutation(api.emailVerification.verifyEmail);
  const sendVerificationEmail = useAction(api.emailVerification.sendVerificationEmail);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyEmail({ email: userEmail, code });
      if (result.alreadyVerified) {
        toast.success("Email already verified! Redirecting...");
      } else {
        toast.success("Email verified successfully!");
      }
      setCode("");
      // The UI will automatically update since the user's emailVerificationTime is now set
      // and the loggedInUser query will reactively update
    } catch (error) {
      console.error("Verification error:", error);
      const errorMessage = error instanceof Error ? error.message : "Invalid verification code";
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await sendVerificationEmail({ email: userEmail });
      toast.success("Verification code resent! Check your email.");
      setCode("");
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Verify Your Email
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            We sent a 6-digit code to
          </p>
          <p className="text-slate-800 dark:text-slate-200 font-medium mt-1">
            {userEmail}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              disabled={isVerifying}
              className="auth-input-field text-center text-2xl tracking-widest font-mono"
              autoComplete="off"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying || code.length !== 6}
            className="auth-button"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Verifying...
              </span>
            ) : (
              "Verify Email"
            )}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={handleResend}
            disabled={isResending}
            className="w-full text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? "Resending..." : "Resend verification code"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
            The code will expire in 10 minutes. If you don't see the email, check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
}
