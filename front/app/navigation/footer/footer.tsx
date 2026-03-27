"use client";
import { FC } from "react";
import classes from "./footer.module.scss";
import Link from "next/link";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppDispatch, useAppSelector } from "@/app/redux/reduxHuks";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ImFacebook2 } from "react-icons/im";
import { SiInstagram, SiLinkedin } from "react-icons/si";
import { FaInstagramSquare } from "react-icons/fa";

const Footer: FC = () => {
    const leng = useAppSelector((state) => state.translation.leng);
    const path = usePathname();
    const nfc = path.split("/").includes("nfc");

    //    ${path.split("/").length === 3 && nfc && classes["hidden"]}
    return (
        <div
            className={`${classes["footer"]} ${
                path.split("/").length === 3 && nfc && classes["hidden"]
            }`}
        >
            <div className={classes["footerContainer"]}>
                <div className={classes["logo"]}>
                    <Link href={"/"}>
                        <Image
                            src="/icons/Codexium.svg"
                            width={240}
                            height={50}
                            alt="codexium"
                            priority
                        />
                    </Link>
                    <p>{translations[leng]["create"]}</p>
                </div>
                <div className={classes["linksContainer"]}>
                    <div className={classes["footerElements"]}>
                        <h4>
                            <Link
                                className={`${classes["footerLink"]} ${
                                    path == "/" ? classes["active"] : ""
                                }`}
                                href={"/"}
                            >
                                {translations[leng]["menu"]["main"]}
                            </Link>
                        </h4>
                        <Link
                            className={`${classes["footerLink"]} ${
                                path == "/weare" ? classes["active"] : ""
                            }`}
                            href={`/weare`}
                        >
                            {translations[leng]["menu"]["who_we_are"]}
                        </Link>
                        <Link
                            className={`${classes["footerLink"]} ${
                                path == "/portfolio" ? classes["active"] : ""
                            }`}
                            href={`/portfolio`}
                        >
                            {translations[leng]["menu"]["portfolio"]}
                        </Link>
                        <Link
                            className={`${classes["footerLink"]} ${
                                path == "/blog" ? classes["active"] : ""
                            }`}
                            href={"/blog"}
                        >
                            {translations[leng]["menu"]["blog"]}
                        </Link>
                    </div>
                    <div className={classes["footerElements"]}>
                        <h4>{translations[leng]["menu"]["our_services"]}</h4>

                        <Link
                            className={`${classes["footerLink"]} ${
                                path == "/webdevelopment" ? classes["active"] : ""
                            }`}
                            href={"/webdevelopment"}
                        >
                            {translations[leng]["website_creation"]}
                        </Link>
                        <Link
                            className={`${classes["footerLink"]} ${
                                path == "/nfcBusiness" ? classes["active"] : ""
                            }`}
                            href={"/nfcBusiness"}
                        >
                            {translations[leng]["menu"]["nfc"]}
                        </Link>
                        <Link
                            className={`${classes["footerLink"]} ${
                                path == "/smm" ? classes["active"] : ""
                            }`}
                            href={"/smm"}
                        >
                            {translations[leng]["smm"]}
                        </Link>
                    </div>
                    <div className={classes["footerElements"]}>
                        <h4>{translations[leng]["tools"]}</h4>

                        <Link
                            className={`${classes["footerLink"]} ${
                                path == "/qrCode" ? classes["active"] : ""
                            }`}
                            href={"/qrCode"}
                        >
                            {translations[leng]["qr"]}
                        </Link>
                        <Link
                            className={`${classes["footerLink"]} ${
                                path == "/compress" ? classes["active"] : ""
                            }`}
                            href={"/compress"}
                        >
                            {translations[leng]["image_comp"]}
                        </Link>

                        <Link
                            className={`${classes["footerLink"]} ${
                                path == "/removeBg" ? classes["active"] : ""
                            }`}
                            href={"/removeBg"}
                        >
                            {translations[leng]["remove_bg"]}
                        </Link>
                    </div>
                    <div className={classes["footerElements"]}>
                        <h4 className={classes["want_talk"]}>{translations[leng]["want_talk"]}</h4>
                        <Link
                            className={`${classes["primary_btn"]}`}
                            href={"https://wa.me/37494107694"}
                            target={"_blank"}
                        >
                            {translations[leng]["lets_talk"]}
                        </Link>
                        <h4 className={classes["sml"]}>{translations[leng]["sml"]}</h4>
                        <div className={classes["sml_links"]}>
                            <Link
                                className={classes["links"]}
                                target={"_blank"}
                                href={"https://www.facebook.com/share/1AvYexxcdu/?mibextid=wwXIfr"}
                            >
                                <ImFacebook2 />
                            </Link>
                            <Link
                                className={classes["links"]}
                                target={"_blank"}
                                href={"https://www.linkedin.com/company/codexium-it/"}
                            >
                                <SiLinkedin />
                            </Link>
                            <Link
                                className={`${classes["links"]} ${classes["insta"]}`}
                                target={"_blank"}
                                href={"https://www.instagram.com/codexium.it"}
                            >
                                <FaInstagramSquare />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <div className={classes["copyrights"]}>{translations[leng]["codexium"]}</div>
        </div>
    );
};

export default Footer;
