export const SITE_URL = "https://codexium.it";

const BASE_PATH = "/security-tools";

// ─── Add new tools here — everything else updates automatically ───────────────
export const CYBER_TOOLS = [
    {
        id: "whois",
        name: "WHOIS Lookup",
        href: `${BASE_PATH}/whois`,
        navLabel: "WHOIS Lookup",
        navShortLabel: "WHOIS",
    },
    {
        id: "ssl",
        name: "SSL / TLS Certificate Checker",
        href: `${BASE_PATH}/ssl-checker`,
        navLabel: "SSL / TLS Checker",
        navShortLabel: "SSL/TLS",
    },
    {
        id: "headers",
        name: "HTTP Security Headers Checker",
        href: `${BASE_PATH}/security-headers`,
        navLabel: "Security Headers",
        navShortLabel: "Headers",
    },
    {
        id: "dns",
        name: "DNS Lookup",
        href: `${BASE_PATH}/dns-lookup`,
        navLabel: "DNS Lookup",
        navShortLabel: "DNS",
    },
    {
        id: "tech",
        name: "Technology Detector",
        href: `${BASE_PATH}/tech-detect`,
        navLabel: "Tech Detect",
        navShortLabel: "Tech",
    },
    {
        id: "email",
        name: "Email Security Checker",
        href: `${BASE_PATH}/email-security`,
        navLabel: "Email Security",
        navShortLabel: "Email",
    },
] as const;

export type CyberToolId = (typeof CYBER_TOOLS)[number]["id"];

/** Absolute URLs for JSON-LD — only used in SEO, not in navigation */
export const TOOLS_ITEM_LIST = CYBER_TOOLS.map((tool, i) => ({
    "@type": "ListItem" as const,
    position: i + 1,
    name: tool.name,
    url: `${SITE_URL}${tool.href}`,
}));

/** Absolute page URL for JSON-LD */
export const SECURITY_TOOLS_URL = `${SITE_URL}${BASE_PATH}`;