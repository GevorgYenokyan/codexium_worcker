import { cookies } from "next/headers";
import { Metadata } from "next";
import { seoData } from "@/app/config/seo";
import { ToolsNavigation } from "./modules/navigation";
import { TOOLS_ITEM_LIST, SECURITY_TOOLS_URL, SITE_URL } from "./modules/cyberToolsRegistry";

type Lang = "arm" | "eng";

const PAGE_URL = SECURITY_TOOLS_URL;
const IMAGE_URL = `${SITE_URL}/images/logo.png`;

const keywords: Record<Lang, string[]> = {
    arm: [
        "կիբերանվտանգության գործիքներ",
        "SSL սերտիֆիկատի ստուգում",
        "HTTP անվտանգության վերնագրեր",
        "WHOIS որոնում",
        "DNS որոնում",
        "email անվտանգություն",
        "SPF DKIM DMARC ստուգում",
        "կայքի տեխնոլոգիաների հայտնաբերում",
        "կայքի անվտանգություն",
        "անվճար անվտանգության գործիքներ",
        "TLS ստուգում",
        "CSP HSTS ստուգիչ",
    ],
    eng: [
        "cybersecurity tools",
        "website security checker",
        "SSL certificate checker",
        "HTTP security headers checker",
        "WHOIS lookup",
        "DNS lookup",
        "email security checker",
        "SPF DKIM DMARC checker",
        "website technology detector",
        "free security audit tools",
        "TLS checker online",
        "web security analysis",
    ],
};

function generateStructuredData(lang: Lang) {
    const name = lang === "arm" ? "Կիբերանվտանգության Գործիքներ" : "Cybersecurity Tools";

    const description =
        lang === "arm"
            ? "Անվճար կիբերանվտանգության գործիքներ՝ WHOIS, DNS, SSL, HTTP վերնագրեր, տեխնոլոգիաների հայտնաբերում, Email (SPF/DKIM/DMARC) ստուգում և այլն։"
            : "Free cybersecurity tools: WHOIS & DNS lookup, SSL/TLS checker, HTTP security headers, technology detector, email security (SPF/DKIM/DMARC) and more.";

    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                url: SITE_URL,
                name: "CODEXIUM",
            },
            {
                "@type": "WebPage",
                "@id": PAGE_URL,
                url: PAGE_URL,
                name,
                description,
                inLanguage: lang === "arm" ? "hy" : "en",
                isPartOf: { "@id": `${SITE_URL}/#website` },
                breadcrumb: {
                    "@type": "BreadcrumbList",
                    itemListElement: [
                        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
                        { "@type": "ListItem", position: 2, name, item: PAGE_URL },
                    ],
                },
            },
            {
                "@type": "ItemList",
                name,
                description,
                url: PAGE_URL,
                // ← Single source of truth — add tools in cyberToolsRegistry.ts
                itemListElement: TOOLS_ITEM_LIST,
            },
        ],
    };
}

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = cookies();
    const lang: Lang = (cookieStore.get("lang")?.value as Lang) || "eng";

    const seo = seoData?.cybersecurityTools?.[lang] ?? seoData?.cybersecurityTools?.eng;

    return {
        title: seo?.title,
        description: seo?.description,
        keywords: keywords[lang],
        openGraph: {
            title: seo?.title,
            description: seo?.description,
            url: PAGE_URL,
            siteName: "CODEXIUM",
            images: [
                { url: IMAGE_URL, width: 800, height: 600, alt: "CODEXIUM Cybersecurity Tools" },
            ],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: seo?.title,
            description: seo?.description,
            creator: "@codexium",
            images: [IMAGE_URL],
        },
        alternates: {
            canonical: PAGE_URL,
            languages: { en: PAGE_URL, hy: PAGE_URL },
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-image-preview": "large",
                "max-video-preview": -1,
                "max-snippet": -1,
            },
        },
    };
}

export default function CybersecurityToolsLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = cookies();
    const lang: Lang = (cookieStore.get("lang")?.value as Lang) || "eng";
    const structuredData = generateStructuredData(lang);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
                }}
            />
            <ToolsNavigation />
            {children}
        </>
    );
}
