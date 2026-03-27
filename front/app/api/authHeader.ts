"use client";
import { getCookie } from "cookies-next/client";

export default function authHeader() {
    let JWT = getCookie("JWT");

    if (JWT) {
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${JWT}`,
        };
    } else {
        return { "Content-Type": "application/json" };
    }
}
