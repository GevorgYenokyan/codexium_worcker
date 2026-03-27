import { InputProps } from "@/app/types/types";

// export const loginData = [
//     { name: "email", label: "Email", type: "email", required: true },
//     { name: "password", label: "Password", type: "password", required: true, min: 6 },
// ] as InputProps[];

export const generateData = (translations: Record<string, any>, lang: string) => {
    return [
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
        },
    ] as InputProps[];
};
