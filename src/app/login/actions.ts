"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createSession, destroySession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");
  if (typeof password !== "string" || password.length === 0) {
    return { error: "Password required." };
  }

  const hash = process.env.AUTH_PASSWORD_HASH;
  if (!hash) {
    return { error: "Server not configured. AUTH_PASSWORD_HASH missing." };
  }

  const ok = await bcrypt.compare(password, hash);
  if (!ok) {
    return { error: "Incorrect password." };
  }

  await createSession();
  redirect("/qa-dashboard");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
