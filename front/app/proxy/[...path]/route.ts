import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://codexium.it/api";

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const jwt = req.cookies.get("JWT")?.value;
    const { path } = await params;
    const pathStr = path.join("/");
    const search = req.nextUrl.search;
    const contentType = req.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");

    // Пробрасываем заголовки
    const forwardHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
        if (key !== "host") {
            forwardHeaders[key] = value;
        }
    });

    if (jwt) {
        forwardHeaders["Authorization"] = `Bearer ${jwt}`;
    }

    // ✅ FIX 1: Удаляем content-length — после трансформации тела он не совпадёт
    delete forwardHeaders["content-length"];

    // ✅ FIX 2: Говорим бэкенду что принимаем несжатый ответ — решает проблему gzip
    forwardHeaders["accept-encoding"] = "identity";

    try {
        let body: BodyInit | undefined;

        if (req.method !== "GET") {
            if (isFormData) {
                const formData = await req.formData();
                body = formData;
                // Убираем content-type — fetch сам выставит с правильным boundary
                delete forwardHeaders["content-type"];
            } else {
                body = await req.text();
            }
        }

        const response = await fetch(`${BACKEND_URL}/${pathStr}${search}`, {
            method: req.method,
            headers: forwardHeaders,
            body,
        });

        // ✅ FIX 2: Читаем как текст — работает без gzip
        const responseText = await response.text();

        try {
            const data = JSON.parse(responseText);
            return NextResponse.json(data, { status: response.status });
        } catch {
            return new NextResponse(responseText, {
                status: response.status,
                headers: { "Content-Type": "text/plain" },
            });
        }
    } catch (error) {
        console.error("PROXY ERROR:", error);
        return NextResponse.json({ message: "Proxy error" }, { status: 500 });
    }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
