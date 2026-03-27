"use client";

import Link from "next/link";
import { CYBER_TOOLS } from "../modules/cyberToolsRegistry";
import classes from "./cybersecuritytools.module.scss";

// ─── UI metadata per tool (icon, tag, description, features) ─────────────────
// href comes from CYBER_TOOLS registry — single source of truth
const toolsMeta: Record<
    string,
    {
        tag: string;
        title: string;
        description: string;
        features: string[];
        icon: React.ReactNode;
    }
> = {
    ssl: {
        tag: "SSL / TLS",
        title: "Certificate Checker",
        description:
            "Inspect SSL/TLS certificate validity, expiry date, issuer chain and supported protocol versions. Get a security grade from A+ to F.",
        features: [
            "Certificate validity",
            "Expiry & days left",
            "TLS 1.0 – 1.3 support",
            "Key strength & algorithm",
        ],
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
            </svg>
        ),
    },
    headers: {
        tag: "HTTP",
        title: "Security Headers",
        description:
            "Analyse HTTP response headers for CSP, HSTS, X-Frame-Options, Referrer-Policy and more. Identify misconfigurations before attackers do.",
        features: [
            "Content-Security-Policy",
            "HSTS enforcement",
            "Clickjacking protection",
            "XSS mitigation headers",
        ],
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" />
                <path d="m9 12 2 2 4-4" />
            </svg>
        ),
    },
    whois: {
        tag: "WHOIS",
        title: "WHOIS Lookup",
        description:
            "Look up domain registration data, IP ownership, nameservers and expiry dates. Works for any domain or IP address — no login required.",
        features: [
            "Registrar & owner info",
            "Expiry date & days left",
            "Nameservers & DNSSEC",
            "IP range, ASN & ISP",
        ],
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M2 12h20" />
            </svg>
        ),
    },
    dns: {
        tag: "DNS",
        title: "DNS Lookup",
        description:
            "Query all DNS record types across 18 global nameservers in one request. Check propagation status and spot inconsistencies instantly.",
        features: [
            "A, AAAA, MX, TXT, NS, SOA…",
            "18 global nameservers",
            "Propagation status",
            "Multi-answer diff view",
        ],
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
            </svg>
        ),
    },
    tech: {
        tag: "DETECT",
        title: "Technology Detector",
        description:
            "Discover the full tech stack of any website — CMS, frameworks, servers, CDN, analytics and more. Detected from headers, cookies and HTML in one scan.",
        features: [
            "CMS & Framework detection",
            "Server & CDN info",
            "Analytics tools",
            "Confidence levels",
        ],
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
        ),
    },
    email: {
        tag: "EMAIL",
        title: "Email Security",
        description:
            "Check SPF, DKIM, DMARC and MTA-STS records for any domain. Identify misconfigurations that leave you exposed to spoofing and phishing.",
        features: [
            "SPF record analysis",
            "DKIM selector check",
            "DMARC policy & alignment",
            "MTA-STS enforcement",
        ],
        icon: (
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
        ),
    },
};

// Merge registry (href, id) with UI metadata
const tools = CYBER_TOOLS.map((t) => ({ ...t, ...toolsMeta[t.id] }));

// ─── Component ────────────────────────────────────────────────────────────────
export default function CybersecurityToolsPage() {
    return (
        <div className={classes.page}>
            {/* Background grid */}
            <div className={classes.bgGrid} aria-hidden="true" />

            <div className={classes.container}>
                {/* ── Hero ── */}
                <header className={classes.hero}>
                    {/* <div className={classes.heroEyebrow}>
                        <span className={classes.terminalPrompt}>~/codexium/tools</span>
                        <span className={classes.heroBadge}>Free · No login</span>
                    </div> */}
                    <h1 className={classes.heroTitle}>
                        Cybersecurity
                        <span className={classes.heroTitleAccent}> Tools</span>
                    </h1>
                    <p className={classes.heroSubtitle}>
                        Professional-grade security auditing tools. Scan any website in seconds and
                        get actionable insights to harden your infrastructure.
                    </p>
                    <div className={classes.heroStats}>
                        <div className={classes.stat}>
                            <span className={classes.statNum}>{CYBER_TOOLS.length}</span>
                            <span className={classes.statLabel}>tools available</span>
                        </div>
                        <div className={classes.statDivider} />
                        <div className={classes.stat}>
                            <span className={classes.statNum}>A+</span>
                            <span className={classes.statLabel}>max grade</span>
                        </div>
                        <div className={classes.statDivider} />
                        <div className={classes.stat}>
                            <span className={classes.statNum}>0ms</span>
                            <span className={classes.statLabel}>signup needed</span>
                        </div>
                    </div>
                </header>

                {/* ── Tools grid ── */}
                <section className={classes.grid}>
                    {tools.map((tool, i) => (
                        <Link
                            key={tool.id}
                            href={tool.href}
                            className={classes.card}
                            style={{ "--i": i } as React.CSSProperties}
                        >
                            {/* scan line animation */}
                            <div className={classes.cardScan} aria-hidden="true" />

                            <div className={classes.cardTop}>
                                <div className={classes.cardIcon}>{tool.icon}</div>
                                <span className={classes.cardTag}>{tool.tag}</span>
                            </div>

                            <h2 className={classes.cardTitle}>{tool.title}</h2>
                            <p className={classes.cardDesc}>{tool.description}</p>

                            <ul className={classes.cardFeatures}>
                                {tool.features.map((f) => (
                                    <li key={f} className={classes.cardFeature}>
                                        <span className={classes.featureTick}>✓</span>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <div className={classes.cardFooter}>
                                <span className={classes.cardCta}>
                                    Run scan
                                    <svg
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className={classes.ctaArrow}
                                    >
                                        <path
                                            d="M3 8h10M9 4l4 4-4 4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </span>
                            </div>
                        </Link>
                    ))}
                </section>

                {/* ── Bottom note ── */}
                <p className={classes.note}>
                    All scans run server-side. No data is stored. Results are generated in real
                    time.
                </p>
            </div>
        </div>
    );
}
