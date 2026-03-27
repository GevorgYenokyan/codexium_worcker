import classes from "./page.module.scss";
import React from "react";

import CybersecurityToolsPage from "./home/cybersecuritytools";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { seoData } from "@/app/config/seo";

type Lang = "arm" | "eng";

const BASE_URL = "https://codexium.it";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = cookies();
    const lang: Lang = (cookieStore.get("lang")?.value as Lang) || "eng";

    const seo = seoData?.cybersecurityTools?.[lang] ?? seoData?.cybersecurityTools?.eng;

    const title = seo?.title;
    const description = seo?.description;

    const keywords: Record<Lang, string[]> = {
        arm: [
            "կիբերանվտանգության գործիքներ",
            "կայքի անվտանգության սկաներ",
            "SSL ստուգում",
            "HTTP անվտանգության վերնագրեր",
            "DNS ստուգում",
            "վեբ անվտանգության վերլուծություն",
            "կայքի խոցելիության ստուգում",
            "անվճար անվտանգության գործիքներ",
        ],
        eng: [
            "cybersecurity tools",
            "website security checker",
            "SSL checker online",
            "HTTP security headers checker",
            "DNS security checker",
            "open port scanner",
            "website vulnerability scanner",
            "free security audit tools",
            "web security analysis",
        ],
    };

    const pageUrl = `${BASE_URL}/security-tools`;
    const imageUrl = `${BASE_URL}/images/logo.png`;

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
                    alt: "CODEXIUM Cybersecurity Tools",
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
            <CybersecurityToolsPage />
        </div>
    );
};

export default Page;
