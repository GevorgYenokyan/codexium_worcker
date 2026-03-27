import { Portfolio } from "@/app/types/types";
import styles from "../style/portfolioItem.module.scss";
import React, { FC } from "react";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Image from "next/image";
import { translations } from "@/app/redux/features/translations/initialtranslations";

interface Props {
    data: Partial<Portfolio>;
}

const PortfolioItem: FC<Props> = ({ data }) => {
    const lang = useAppSelector((state) => state.translation.leng);

    return (
        <div className={styles.portfolio}>
            <h2>{lang === "arm" ? data.title : data.title_eng}</h2>

            <div className={styles.info}>
                {data?.images && (
                    <a target={"_blank"} href={data?.Website_link} className={styles.popupImage}>
                        <Image
                            src={`https://codexium.it/${data?.images[0]?.imagePath}`}
                            alt="img"
                            width={800}
                            height={600}
                            quality={100}
                            property=""
                        />
                    </a>
                )}

                <div className={styles.about_project}>
                    <h2>{translations[lang]["aboutProject"]}</h2>

                    <h3>
                        <b className={styles.green}>{translations[lang]["projectName"]}:</b>
                        <b className={styles.white}>
                            {lang === "arm" ? data.project_name : data.project_name_eng}
                        </b>
                    </h3>
                    <h3>
                        <b className={styles.green}>{translations[lang]["client"]}:</b>
                        <b className={styles.white}>
                            {lang === "arm" ? data.client : data.client_eng}
                        </b>
                    </h3>
                    <h3>
                        <b className={styles.green}>{translations[lang]["technologies"]}:</b>
                        <b className={styles.white}>{data.technologies}</b>
                    </h3>
                    <h3>
                        <b className={styles.green}>{translations[lang]["websiteLink"]}:</b>
                        <a target={"_blank"} href={data?.Website_link} className={styles.white}>
                            {document.body.offsetWidth > 450
                                ? data?.Website_link?.slice(8, data?.Website_link?.length)
                                : `${data?.Website_link?.slice(8, 26)}`}
                        </a>
                    </h3>
                </div>
            </div>
            <div className={styles.description}>
                <h2>{translations[lang]["description"]}</h2>

                <p>{lang === "arm" ? data.description : data.description_eng}</p>
            </div>
        </div>
    );
};

export default PortfolioItem;
