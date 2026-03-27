import React from "react";
import EmailSecurityPage from "./components/emailSecurityPage";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { seoData } from "@/app/config/seo";

type Lang = "arm" | "eng";

const BASE_URL = "https://codexium.it";
const PAGE_URL = `${BASE_URL}/security-tools/email-security`;
const IMAGE_URL = `${BASE_URL}/images/logo.png`;

const keywords: Record<Lang, string[]> = {
    arm: [
        "email անվտանգություն",
        "SPF ստուգում",
        "DKIM ստուգում",
        "DMARC ստուգում",
        "MTA-STS",
        "դոմեն email պաշտպանություն",
        "անվճար email security checker",
    ],
    eng: [
        "email security checker",
        "SPF record checker",
        "DKIM validator",
        "DMARC checker",
        "MTA-STS check",
        "domain email security",
        "free email security audit",
        "check SPF DKIM DMARC online",
    ],
};

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = cookies();
    const lang: Lang = (cookieStore.get("lang")?.value as Lang) || "eng";

    const seo = (seoData as any)?.emailSecurity?.[lang];

    const title =
        seo?.title ??
        (lang === "arm"
            ? "Email Անվտանգության Ստուգում — CODEXIUM"
            : "Email Security Checker — CODEXIUM");

    const description =
        seo?.description ??
        (lang === "arm"
            ? "Ստուգեք ձեր դոմենի SPF, DKIM, DMARC և MTA-STS կարգավորումները CODEXIUM-ի միջոցով։ Պաշտպանեք ձեր email-ները spoofing-ից և phishing-ից։"
            : "Check SPF, DKIM, DMARC and MTA-STS records for any domain. Identify email security misconfigurations and protect against spoofing and phishing — free, no login required.");

    return {
        title,
        description,
        keywords: keywords[lang],
        openGraph: {
            title,
            description,
            url: PAGE_URL,
            siteName: "CODEXIUM",
            images: [
                { url: IMAGE_URL, width: 800, height: 600, alt: "CODEXIUM Email Security Checker" },
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
        alternates: { canonical: PAGE_URL },
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
        <div>
            <EmailSecurityPage />
        </div>
    );
};

export default Page;
