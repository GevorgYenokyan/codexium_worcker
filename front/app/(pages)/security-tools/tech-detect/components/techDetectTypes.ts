export type TechCategory =
    | "CMS"
    | "Framework"
    | "Language"
    | "Server"
    | "CDN"
    | "Analytics"
    | "Security"
    | "Database"
    | "Cache"
    | "OS"
    | "Library"
    | "BuildTool";

export interface DetectedTech {
    name: string;
    version: string | null;
    category: TechCategory;
    confidence: "high" | "medium" | "low";
    detectedBy: string;
}

export interface TechDetectionResult {
    domain: string;
    technologies: DetectedTech[];
    byCategory: Record<TechCategory, DetectedTech[]>;
    rawHeaders: Record<string, string>;
    scannedAt: string;
    cdnBlocking: boolean;
    cdnNote: string | null;
    summary: { total: number; byCategory: Record<string, number> };
}

export const CAT: Record<TechCategory, { icon: string; color: string }> = {
    CMS: { icon: "📝", color: "#4bb749" },
    Framework: { icon: "⚙️", color: "#2196f3" },
    Language: { icon: "💻", color: "#9c27b0" },
    Server: { icon: "🖥", color: "#ff9800" },
    CDN: { icon: "🌐", color: "#00bcd4" },
    Analytics: { icon: "📊", color: "#e91e63" },
    Security: { icon: "🔒", color: "#f44336" },
    Database: { icon: "🗄", color: "#795548" },
    Cache: { icon: "⚡", color: "#ffc107" },
    OS: { icon: "💾", color: "#607d8b" },
    Library: { icon: "📦", color: "#009688" },
    BuildTool: { icon: "🔧", color: "#ff5722" },
};
