// passwordStrength.ts

import { PasswordStrength } from "@/app/types/types";

export const getPasswordStrength = (value: string): PasswordStrength => {
    let score = 0;

    if (value.length >= 8) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (value.length >= 12) score++;

    if (score <= 2) return "weak";
    if (score <= 4) return "medium";
    return "strong";
};
