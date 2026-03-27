import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { token } = await req.json();

    const response = NextResponse.json({ success: true });

    response.cookies.set("JWT", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 дней
    });

    response.cookies.set("isLoggedIn", "true", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });

    return response;
}
