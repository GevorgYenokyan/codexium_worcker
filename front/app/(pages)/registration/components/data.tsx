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
        {
            name: "password",
            label: translations[lang]["Password"],
            type: "password",
            required: true,
            min: 8,
            placeholder: translations[lang]["Password"],
            passGenerate: true,
        },
    ] as InputProps[];
};

export const userTypes = (lang: string, translations: Record<string, any>): Option[] => {
    return [
        { code: "specialist", label: translations[lang]["Specialist"] },
        { code: "employer", label: translations[lang]["Employer"] },
        { code: "simple user", label: translations[lang]["Simple User"] },
    ];
};
