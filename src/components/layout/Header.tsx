import { Authenticated } from "convex/react";
import { SignOutButton } from "../auth/SignOutButton";
import { ThemeToggle } from "../theme/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-16 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 shadow-sm px-4">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Dream Journal</h2>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </div>
    </header>
  );
}
