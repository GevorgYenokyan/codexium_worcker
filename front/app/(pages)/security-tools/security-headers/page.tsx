import classes from "./page.module.scss";
import SecurityHeadersPage from "./components/securityheaderspage";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { seoData } from "@/app/config/seo";

type Lang = "arm" | "eng";

const BASE_URL = "https://codexium.it";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = cookies();
    const lang: Lang = (cookieStore.get("lang")?.value as Lang) || "eng";

    const seo = seoData?.securityHeaders?.[lang] ?? seoData?.securityHeaders?.eng;

    const title = seo?.title ?? "Security Headers Checker — CODEXIUM";

    const description =
        seo?.description ??
        "Free HTTP security headers checker. Scan any website and get a detailed security report with a security grade from A+ to F.";

    const keywords: Record<Lang, string[]> = {
        arm: [
            "HTTP անվտանգության վերնագրեր",
            "կայքի անվտանգություն",
            "CSP ստուգում",
            "HSTS ստուգում",
            "X-Frame-Options",
            "վեբ անվտանգության գործիք",
            "անվճար անվտանգության ստուգում",
        ],
        eng: [
            "security headers checker",
            "HTTP security headers",
            "CSP checker",
            "HSTS checker",
            "X-Frame-Options",
            "Content-Security-Policy",
            "website security audit",
            "free website security scanner",
        ],
    };

    const imageUrl = `${BASE_URL}/images/logo.png`;
    const pageUrl = `${BASE_URL}/security-tools/security-headers`;

    return {
        title,
        description,
        keywords: keywords[lang],

        openGraph: {
            title,
            description,
            url: pageUrl,
            siteName: "CODEXIUM",
            images: [
                {
                    url: imageUrl,
                    width: 800,
                    height: 600,
                    alt: "CODEXIUM Security Headers Checker",
                },
            ],
            type: "website",
        },

        twitter: {
            card: "summary_large_image",
            title,
            description,
            creator: "@codexium",
            images: [imageUrl],
        },

        alternates: {
            canonical: pageUrl,
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

const Page = () => {
    return (
        <div className={classes.main}>
            <SecurityHeadersPage />
        </div>
    );
};

export default Page;
