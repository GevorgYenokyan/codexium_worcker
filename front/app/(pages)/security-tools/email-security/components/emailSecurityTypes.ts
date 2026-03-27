export type SpfResult = "pass" | "fail" | "missing" | "invalid";
export type DmarcPolicy = "none" | "quarantine" | "reject";

export interface SpfAnalysis {
    raw: string | null;
    result: SpfResult;
    mechanisms: string[];
    allMechanism: string | null;
    issues: string[];
    recommendations: string[];
}

export interface DkimSelector {
    selector: string;
    found: boolean;
    raw: string | null;
    keyType: string | null;
    keyBits: number | null;
    issues: string[];
}

export interface DmarcAnalysis {
    raw: string | null;
    found: boolean;
    policy: DmarcPolicy | null;
    subdomainPolicy: DmarcPolicy | null;
    percentage: number | null;
    rua: string[];
    ruf: string[];
    alignment: { spf: "relaxed" | "strict" | null; dkim: "relaxed" | "strict" | null };
    issues: string[];
    recommendations: string[];
}

export interface MtaStsAnalysis {
    found: boolean;
    mode: "enforce" | "testing" | "none" | null;
    issues: string[];
}

export interface EmailSecurityResult {
    domain: string;
    grade: "A+" | "A" | "B" | "C" | "D" | "F";
    score: number;
    spf: SpfAnalysis;
    dkim: DkimSelector[];
    dmarc: DmarcAnalysis;
    mtaSts: MtaStsAnalysis;
    summary: { passed: number; failed: number; warnings: number };
    scannedAt: string;
}

// ─── Shared color maps ────────────────────────────────────────────────────────
export const GRADE_COLOR: Record<string, string> = {
    "A+": "#4bb749",
    A: "#4bb749",
    B: "#8bc34a",
    C: "#ffc107",
    D: "#ff9800",
    F: "#f44336",
};

export const SPF_COLOR: Record<SpfResult, string> = {
    pass: "#4bb749",
    fail: "#f44336",
    missing: "#f44336",
    invalid: "#ff9800",
};

export const POLICY_COLOR: Record<string, string> = {
    reject: "#4bb749",
    quarantine: "#ffc107",
    none: "#ff9800",
};
