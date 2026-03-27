import React from "react";
import DnsLookupPage from "./components/dnslookuppage";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { seoData } from "@/app/config/seo";

type Lang = "arm" | "eng";

const BASE_URL = "https://codexium.it";
const PAGE_URL = `${BASE_URL}/cybersecurityTools/dnsLookup`;
const IMAGE_URL = `${BASE_URL}/images/logo.png`;

const keywords: Record<Lang, string[]> = {
    arm: [
        "DNS որոնում",
        "DNS ռեկորդների ստուգում",
        "դոմենի DNS",
        "DNS տարածում",
        "A AAAA MX TXT NS ստուգում",
        "գլոբալ DNS ստուգում",
        "DNS propagation checker",
        "անվճար DNS գործիք",
    ],
    eng: [
        "DNS lookup",
        "DNS record checker",
        "DNS propagation checker",
        "check DNS records online",
        "A AAAA MX TXT NS record lookup",
        "global DNS checker",
        "free DNS lookup tool",
        "DNS propagation test",
        "nameserver lookup",
        "domain DNS check",
    ],
};

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = cookies();
    const lang: Lang = (cookieStore.get("lang")?.value as Lang) || "eng";

    const seo = (seoData as any)?.dnsLookup?.[lang];

    const title =
        seo?.title ?? (lang === "arm" ? "DNS Lookup — CODEXIUM" : "DNS Lookup — CODEXIUM");

    const description =
        seo?.description ??
        (lang === "arm"
            ? "Ստուգեք ցանկացած դոմենի DNS ռեկորդները CODEXIUM-ի միջոցով։ A, AAAA, MX, TXT, NS, SOA և այլ ռեկորդներ 18 գլոբալ nameserver-ներից — մեկ հարցումով։"
            : "Look up all DNS record types for any domain across 18 global nameservers in one request. Check A, AAAA, MX, TXT, NS, SOA records and verify propagation status — free, no login required.");

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
                {
                    url: IMAGE_URL,
                    width: 800,
                    height: 600,
                    alt: "CODEXIUM DNS Lookup",
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
            canonical: PAGE_URL,
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
        <div>
            <DnsLookupPage />
        </div>
    );
};

export default Page;
