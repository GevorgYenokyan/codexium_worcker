import React from "react";
import PortfolioList from "./components/portfolioList";
import classes from "./page.module.scss";
import Image from "next/image";
import Testimonials from "@/app/home/components/testimonials";

import { cookies } from "next/headers";
import { Metadata } from "next";
import { seoData } from "@/app/config/seo";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = cookies();
    const lang = cookieStore.get("lang")?.value || "eng";

    const title = seoData["portfolio"][lang]["title"];

    const description = seoData["portfolio"][lang]["description"];

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
    };
}

const page = () => {
    return (
        <div className={classes.page}>
            <Image
                src="/icons/left.svg"
                width={200}
                height={320}
                alt="arrow"
                className={classes["right"]}
                priority
            />
            <PortfolioList />

            <Testimonials />
        </div>
    );
};

export default page;
