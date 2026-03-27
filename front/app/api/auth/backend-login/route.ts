import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const body = await req.json();

    const response = await fetch("https://codexium.it/api/google-login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        return NextResponse.json({ error: "Backend auth failed" }, { status: 401 });
    }

    const data = await response.json();

    cookies().set("JWT", data.token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 дней
    });

    return NextResponse.json({ ok: true });
}
