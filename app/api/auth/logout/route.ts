import { NextResponse } from "next/server";
import { getSession, invalidateSession } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();

    if (session) {
      await invalidateSession(session.sessionId);
    }

    const response = NextResponse.json({ message: "Logged out successfully" });
    response.cookies.delete("auth_token");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ message: "Logged out" });
    response.cookies.delete("auth_token");
    return response;
  }
}
