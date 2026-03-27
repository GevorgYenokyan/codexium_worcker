import classes from "./page.module.scss";
import WhoisPage from "./components/whoispage";
import { cookies } from "next/headers";
import { Metadata } from "next";
import { seoData } from "@/app/config/seo";

type Lang = "arm" | "eng";

const BASE_URL = "https://codexium.it";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = cookies();
    const lang: Lang = (cookieStore.get("lang")?.value as Lang) || "eng";

    const seo = seoData?.whois?.[lang] ?? seoData?.whois?.eng;

    const title = seo?.title ?? "WHOIS Lookup Tool — CODEXIUM";

    const description =
        seo?.description ??
        "Free WHOIS lookup tool. Check domain and IP address information including registrar, nameservers, expiration date, ASN and ISP.";

    const keywords: Record<Lang, string[]> = {
        arm: [
            "WHOIS որոնում",
            "դոմենի WHOIS",
            "դոմենի սեփականատեր",
            "IP WHOIS որոնում",
            "դոմենի գրանցման տվյալներ",
            "nameservers ստուգում",
            "DNSSEC ստուգում",
            "անվճար WHOIS գործիք",
            "դոմենի ժամկետ",
        ],
        eng: [
            "whois lookup",
            "domain whois search",
            "whois domain owner",
            "ip whois lookup",
            "domain registrar info",
            "domain expiration checker",
            "nameserver lookup",
            "dnssec checker",
            "free whois tool",
            "whois search online",
        ],
    };

    const imageUrl = `${BASE_URL}/images/logo.png`;
    const pageUrl = `${BASE_URL}/security-tools/whois`;

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
                    alt: "CODEXIUM WHOIS Lookup",
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
            <WhoisPage />
        </div>
    );
};

export default Page;
