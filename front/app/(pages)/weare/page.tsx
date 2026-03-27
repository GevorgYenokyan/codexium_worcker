import { FC } from "react";
import classes from "./styles/page.module.scss";
import WeAre from "./components/weAre";
import Image from "next/image";
import Builts from "./components/builts";
import Ai from "./components/ai";

import { cookies } from "next/headers";
import { Metadata } from "next";
import { seoData } from "@/app/config/seo";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = cookies();
    const lang = cookieStore.get("lang")?.value || "arm";

    const title = seoData["about"][lang]["title"];

    const description = seoData["about"][lang]["description"];

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

const About: FC = () => {
    return (
        <div className={classes["weAre"]}>
            <Image
                src="/icons/left.svg"
                width={200}
                height={320}
                alt="arrow"
                className={classes["right"]}
                priority
            />
            <div className={classes["container"]}>
                <WeAre />
                <Builts />
                <Ai />
            </div>
        </div>
    );
};

export default About;
