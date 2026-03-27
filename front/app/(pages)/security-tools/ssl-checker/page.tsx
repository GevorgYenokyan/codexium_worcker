import { Metadata } from "next";
import { cookies } from "next/headers";
import { seoData } from "@/app/config/seo";

import classes from "./page.module.scss";
import SslCheck from "./components/sslcheck";

type Lang = "arm" | "eng";

const BASE_URL = "https://codexium.it";
const IMAGE_URL = `${BASE_URL}/images/logo.png`;

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = cookies();
    const lang: Lang = (cookieStore.get("lang")?.value as Lang) || "eng";

    const seo = seoData?.sslCheck?.[lang] ?? seoData?.sslCheck?.eng;

    const title = seo?.title ?? "SSL/TLS Certificate Checker — CODEXIUM";
    const description =
        seo?.description ??
        "Check any website's SSL/TLS certificate and ensure HTTPS security compliance.";

    const keywords: Record<Lang, string[]> = {
        arm: [
            "SSL ստուգում",
            "TLS սերտիֆիկատ",
            "կայքի անվտանգություն",
            "HTTPS ստուգում",
            "անվճար SSL գործիք",
            "certificate expiry ստուգում",
            "TLS 1.3 աջակցություն",
        ],
        eng: [
            "SSL checker",
            "TLS certificate checker",
            "check SSL certificate",
            "HTTPS security",
            "certificate expiry",
            "TLS 1.3 support",
            "weak key detection",
        ],
    };

    const pageUrl = `${BASE_URL}/security-tools/sslCheck`;

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
                    url: IMAGE_URL,
                    width: 800,
                    height: 600,
                    alt: "CODEXIUM SSL/TLS Certificate Checker",
                },
            ],
            type: "website",
        },

        twitter: {
            card: "summary_large_image",
            title,
            description,
            creator: "@codexium",
            images: [IMAGE_URL],
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
                "max-snippet": -1,
                "max-video-preview": -1,
            },
        },
    };
}

const Page = () => (
    <div className={classes.main}>
        <SslCheck />
    </div>
);

export default Page;
