import { Authenticated, Unauthenticated, useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { DreamJournal } from "./features/dreams/DreamJournal";
import { ThemeProvider } from "./components/theme/ThemeProvider";
import { Header } from "./components/layout/Header";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { VerificationRequired } from "./components/auth/VerificationRequired";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-4xl mx-auto">
            <Content />
          </div>
        </main>
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const sendVerificationEmail = useAction(api.emailVerification.sendVerificationEmail);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  // Send verification email automatically when user signs up with password
  useEffect(() => {
    if (loggedInUser && loggedInUser.email && !loggedInUser.emailVerificationTime && !verificationEmailSent) {
      sendVerificationEmail({ email: loggedInUser.email })
        .then(() => {
          setVerificationEmailSent(true);
          toast.info("Please check your email for a verification code");
        })
        .catch((error) => {
          console.error("Failed to send verification email:", error);
          toast.error("Failed to send verification email. Please try again.");
        });
    }
  }, [loggedInUser, sendVerificationEmail, verificationEmailSent]);

  if (loggedInUser === undefined) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col gap-8">
      <Authenticated>
        {/* Check if user needs email verification */}
        {loggedInUser?.email && !loggedInUser?.emailVerificationTime ? (
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-light text-slate-800 dark:text-slate-200 mb-2">
              One More Step
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-8">
              Please verify your email to access your dream journal
            </p>
            <VerificationRequired userEmail={loggedInUser.email} />
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-light text-slate-800 dark:text-slate-200 mb-2">
                Hello {loggedInUser?.name || loggedInUser?.email?.split('@')[0] || 'dreamer'}, how did you dream?
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Capture your dreams and discover patterns in your sleep
              </p>
            </div>
            <DreamJournal />
          </>
        )}
      </Authenticated>

      <Unauthenticated>
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-light text-slate-800 dark:text-slate-200 mb-4">
            Dream Journal
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            A private space to record and reflect on your dreams
          </p>
        </div>
        <div className="max-w-md mx-auto">
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
