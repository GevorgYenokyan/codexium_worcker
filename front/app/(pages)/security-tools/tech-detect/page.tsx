import React, { FC } from "react";
import TechDetectPage from "./components/techDetectPage";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { seoData } from "@/app/config/seo";

type Lang = "arm" | "eng";

const BASE_URL = "https://codexium.it";
const PAGE_URL = `${BASE_URL}/security-tools/tech-detect`;
const IMAGE_URL = `${BASE_URL}/images/logo.png`;

const keywords: Record<Lang, string[]> = {
    arm: [
        "կայքի տեխնոլոգիաների հայտնաբերում",
        "CMS հայտնաբերում",
        "վեբ ֆրեյմվորկ ստուգում",
        "կայքի stack",
        "WordPress հայտնաբերում",
        "անվճար tech detector",
        "կայքի անալիզ",
    ],
    eng: [
        "website technology detector",
        "tech stack checker",
        "what tech stack does this site use",
        "cms detector online",
        "find website technology",
        "website analyzer tool",
        "detect website framework",
        "what cms is this site using",
        "free tech stack lookup",
        "website scanner online",
    ],
};

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = cookies();
    const lang: Lang = (cookieStore.get("lang")?.value as Lang) || "eng";

    const seo = (seoData as any)?.techDetect?.[lang];

    const title =
        seo?.title ??
        (lang === "arm"
            ? "Տեխնոլոգիաների Հայտնաբերում — CODEXIUM"
            : "Technology Detector — CODEXIUM");

    const description =
        seo?.description ??
        (lang === "arm"
            ? "Հայտնաբերեք ցանկացած կայքի տեխնոլոգիաները CODEXIUM-ի միջոցով։ CMS, Framework, Server, CDN, Analytics և այլ բաղադրիչներ — մեկ սկանով։"
            : "Find out what technologies power any website. Detect CMS, frameworks, servers, CDN, analytics tools and more — free, no login required.");

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
                { url: IMAGE_URL, width: 800, height: 600, alt: "CODEXIUM Technology Detector" },
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

const Page: FC = () => {
    return (
        <div>
            <TechDetectPage />
        </div>
    );
};

export default Page;
