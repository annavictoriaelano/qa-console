import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import LoginForm from "./_components/login-form";

export default async function LoginPage() {
  const session = await readSession();
  if (session) {
    redirect("/qa-dashboard");
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            QA Console
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to continue.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
