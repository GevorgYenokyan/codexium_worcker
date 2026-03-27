"use client";
import { InputProps, Option } from "@/app/types/types";

export const generateData = (translations: Record<string, any>, lang: string) => {
    return [
        {
            name: "name",
            label: translations[lang]["user_name"],
            type: "text",
            required: true,
            placeholder: translations[lang]["user_name"],
            min: 2,
        },
        {
            name: "email",
            label: translations[lang]["Email"],
            type: "email",
            required: true,
            placeholder: translations[lang]["Email"],
        },
    ] as InputProps[];
};
