"use client";
import { getCookie } from "cookies-next/client";

export default function authHeader() {
    let JWT = getCookie("accessToken");

    if (JWT) {
        return {
            "Content-Type": "application/json",
            Authorization: `${JWT}`,
        };
    } else {
        return { "Content-Type": "application/json" };
    }
}
