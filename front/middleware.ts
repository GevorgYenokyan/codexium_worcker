import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    if (pathname === "/") {
        return NextResponse.redirect(new URL("/eng", req.url));
    }

    const protectedRoutes = ["/profile", "/nfc", "/nfcOrder"];
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
        const token = req.cookies.get("JWT");

        if (!token) {
            const redirectUrl = new URL(
                `/login?callback=${req.url.replace("localhost:3000", "codexium.it")}`,
                req.url,
            );
            return NextResponse.redirect(redirectUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/profile", "/nfc", "/nfcOrder"],
};
