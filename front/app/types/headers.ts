export type HeaderStatus = "present" | "missing" | "warning";
export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

export interface HeaderResult {
    name: string;
    status: HeaderStatus;
    value: string | null;
    description: string;
    recommendation: string | null;
    weight: "critical" | "important" | "medium";
    learnMoreUrl: string;
}

export interface ScanResult {
    url: string;
    grade: Grade;
    score: number;
    scannedAt: string;
    headers: HeaderResult[];
    rawHeaders: Record<string, string>;
    summary: { passed: number; failed: number; warnings: number };
}
