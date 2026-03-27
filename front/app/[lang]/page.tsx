import { cookies } from "next/headers";
import { Metadata } from "next";
import { seoData } from "../config/seo";
import WeAre from "../home/components/weare";
import WeOffer from "../home/components/weoffer";
import Websiteneed from "../home/components/websiteneed";
import Whywe from "../home/components/whywe";
import Technology from "../home/components/technology";
import Testimonials from "../home/components/testimonials";
import Trustus from "../home/components/trustus";
import styles from "../page.module.css";

type Props = {
    params: { lang: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const lang = params?.lang || "eng";

    const homeSeo = seoData?.homePage?.[lang] || seoData?.homePage?.["eng"] || {};

    const title = homeSeo?.title || "Codexium";
    const description = homeSeo?.description || "Codexium – Digital Solutions";

    return {
        title,
        description,
        keywords:
            lang === "arm"
                ? "Codexium կայքեր, վեբ կայքերի պատրաստում, բիզնես կայք, կազմակերպության կայք, կայք պատվիրել, կայք Հայաստանում"
                : "Codexium websites, business website development, company site, order website, custom websites, affordable web design",
        openGraph: {
            title,
            description,
            url: "https://codexium.it",
            siteName: "Codexium",
            images: [
                {
                    url: "https://codexium.it/images/logo.png",
                    width: 800,
                    height: 600,
                    alt: "Codexium Logo",
                },
            ],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            site: "@codexium",
            creator: "@codexium",
            images: [
                {
                    url: "https://codexium.it/images/logo.png",
                    alt: "Codexium Logo",
                },
            ],
        },
        alternates: {
            canonical: "https://codexium.it",
        },
    };
}

//
export default function Home() {
    return (
        <main className={styles.main}>
            <WeAre />
            <WeOffer />
            <Websiteneed />
            <Whywe />
            <Technology />
            <Testimonials />
            <Trustus />
        </main>
    );
}
