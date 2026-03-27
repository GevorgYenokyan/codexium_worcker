// ─── URL / Host validators ────────────────────────────────────────────────────
// Each function exactly mirrors the corresponding backend DTO validation.

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

// ─── 1. CheckHeadersDto ───────────────────────────────────────────────────────
// @IsUrl({ protocols: ['http','https'], require_protocol: true, require_tld: true })
// + auto-inject https:// on normalize

const VALID_PROTOCOLS = ["http:", "https:"];

/**
 * Injects "https://" if the user typed a bare domain.
 * Leaves other protocols untouched so validateHeadersUrl can reject them.
 */
export function normalizeUrl(raw: string): string {
    if (typeof raw !== "string") return "";
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    // Unknown protocol (e.g. ftp://) — pass through, validator will reject
    if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

/**
 * Mirrors CheckHeadersDto:
 * - Must be http:// or https://
 * - require_tld: true (at least one dot + alpha TLD)
 * - No bare IP addresses
 */
export function validateHeadersUrl(raw: string): ValidationResult {
    if (!raw.trim()) {
        return { valid: false, error: "Enter a website address to scan" };
    }

    let parsed: URL;
    try {
        parsed = new URL(raw.trim());
    } catch {
        return {
            valid: false,
            error: "Check the address — something looks off (e.g. example.com)",
        };
    }

    if (!VALID_PROTOCOLS.includes(parsed.protocol)) {
        return { valid: false, error: "Only http:// and https:// addresses are supported" };
    }

    const hostname = parsed.hostname;
    if (!hostname.match(/\.([a-z]{2,})$/i)) {
        return {
            valid: false,
            error: "Check the address — something looks off (e.g. example.com)",
        };
    }

    return { valid: true };
}

// ─── 2. CheckSslDto ───────────────────────────────────────────────────────────
// @MaxLength(253)
// @Matches(/^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/)
// Accepts plain hostnames AND full URLs; no IP addresses.

const SSL_REGEX =
    /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;

/**
 * Strips protocol and path, leaving only the clean hostname the backend needs.
 */
export function normalizeSslHost(raw: string): string {
    if (typeof raw !== "string") return "";
    return raw
        .trim()
        .replace(/^https?:\/\//i, "")
        .split("/")[0]
        .split("?")[0];
}

/**
 * Mirrors CheckSslDto:
 * - Optional http:// / https:// prefix
 * - Valid domain with TLD (no bare IPs)
 * - Optional port and path
 * - MaxLength 253
 */
export function validateSslHost(raw: string): ValidationResult {
    const trimmed = raw.trim();

    if (!trimmed) {
        return { valid: false, error: "Enter a domain to check" };
    }

    if (trimmed.length > 253) {
        return { valid: false, error: "That address is too long" };
    }

    if (!SSL_REGEX.test(trimmed)) {
        return {
            valid: false,
            error: "Check the address — something looks off (e.g. example.com)",
        };
    }

    return { valid: true };
}

// ─── 3. WhoisLookupDto ────────────────────────────────────────────────────────
// @MaxLength(253)
// @Matches(/^(([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3}|([0-9a-fA-F:]+))$/)
// Accepts: domain names, IPv4, IPv6.

const WHOIS_REGEX =
    /^(([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3}|([0-9a-fA-F:]+))$/;

/**
 * Strips protocol and path so the user can paste a full URL.
 */
export function normalizeWhoisQuery(raw: string): string {
    if (typeof raw !== "string") return "";
    return raw
        .trim()
        .replace(/^https?:\/\//i, "")
        .split("/")[0]
        .split("?")[0];
}

/**
 * Mirrors WhoisLookupDto:
 * - Valid domain name, IPv4, or IPv6
 * - MaxLength 253
 */
export function validateWhoisQuery(raw: string): ValidationResult {
    const trimmed = raw.trim();

    if (!trimmed) {
        return { valid: false, error: "Enter a domain or IP address to look up" };
    }

    if (trimmed.length > 253) {
        return { valid: false, error: "That address is too long" };
    }

    if (!WHOIS_REGEX.test(trimmed)) {
        return {
            valid: false,
            error: "Check the address — something looks off (e.g. example.com or 8.8.8.8)",
        };
    }

    return { valid: true };
}
