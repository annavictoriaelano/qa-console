import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "./session";

export const verifySession = cache(async () => {
  const session = await readSession();
  if (!session) {
    redirect("/login");
  }
  return { isAuth: true as const };
});
