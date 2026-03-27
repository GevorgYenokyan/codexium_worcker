"use client";
import { FC, useState } from "react";
import classes from "../style/links.module.scss";
import Link from "next/link";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppDispatch, useAppSelector } from "@/app/redux/reduxHuks";
import { usePathname, useSearchParams } from "next/navigation";
import { FaChevronDown } from "react-icons/fa6";
import SelectLanguage from "./selectLanguage";
import Image from "next/image";
import { IoIosArrowForward } from "react-icons/io";
import { getCookie } from "cookies-next/client";
import OrderNow from "./orderNow";
import { useSession } from "next-auth/react";

const MenuLinks: FC = () => {
    const leng = useAppSelector((state) => state.translation.leng);
    const [order, setOrder] = useState(false);
    const path = usePathname();
    const dispatch = useAppDispatch();
    let JWT = getCookie("isLoggedIn");

    const session = useSession();

    const getImage = () => {
        if (session?.data && session?.data?.user?.image) {
            return session?.data?.user.image;
        }
        return JWT ? "/icons/user.png" : "/icons/User.svg";
    };

    return (
        <nav className={classes["linksContainer"]}>
            <Link className={`${classes["nav_link"]} `} href={"/"}>
                <Image
                    src={"/icons/logo.png"}
                    alt="logo"
                    width={60}
                    height={51}
                    className={classes.logo}
                />
            </Link>
            <div className={classes.links}>
                <Link
                    className={`${classes["nav_link"]} ${path == "/" ? classes["active"] : ""}`}
                    href={"/"}
                >
                    {translations[leng]["menu"]["main"]}
                </Link>
                <Link
                    className={`${classes["nav_link"]} ${
                        path == "/weare" ? classes["active"] : ""
                    }`}
                    href={`/weare`}
                >
                    {translations[leng]["menu"]["who_we_are"]}
                </Link>
                <Link
                    className={`${classes["nav_link"]} ${
                        path == "/portfolio" ? classes["active"] : ""
                    }`}
                    href={`/portfolio`}
                >
                    {translations[leng]["menu"]["portfolio"]}
                </Link>

                <div className={classes["dropdown"]}>
                    <button className={`${classes["nav_link"]} ${classes["dropbtn"]} `}>
                        {translations[leng]["menu"]["our_services"]}{" "}
                        <FaChevronDown className={classes["arrowDown"]} />
                    </button>
                    <div className={classes["dropdown-content"]}>
                        <Link
                            className={`${classes["dropdownLinks"]} ${
                                path == "/security-tools" ? classes["active"] : ""
                            }`}
                            href={`/security-tools`}
                        >
                            {translations[leng]["menu"]["cybersecurityTools"]}
                        </Link>
                        <Link
                            className={`${classes["dropdownLinks"]} ${
                                path == "/webdevelopment" ? classes["active"] : ""
                            }`}
                            href={`/webdevelopment`}
                        >
                            {translations[leng]["menu"]["websites"]}
                        </Link>

                        <Link
                            className={`${classes["dropdownLinks"]} ${
                                path == "/smm" ? classes["active"] : ""
                            }`}
                            href={`/smm`}
                        >
                            {translations[leng]["menu"]["smm"]}
                        </Link>
                        <Link
                            className={`${classes["dropdownLinks"]} ${
                                path == "/nfcBusiness" ? classes["active"] : ""
                            }`}
                            href={`/nfcBusiness`}
                        >
                            {translations[leng]["nfc_card"]}
                        </Link>
                        <Link
                            className={`${classes["dropdownLinks"]} ${
                                path == "/appdevelopment" ? classes["active"] : ""
                            }`}
                            href={`/appdevelopment`}
                        >
                            {translations[leng]["menu"]["app"]}
                        </Link>
                        <div className={`${classes["tools"]} ${classes["dropdownLinks"]}`}>
                            <div className={classes["toolsBtn"]}>
                                <span>{translations[leng]["tools"]}</span>
                                <IoIosArrowForward className={classes["arrow"]} />
                            </div>
                            <div className={classes["tools-content"]}>
                                <Link
                                    className={`${classes["toolsLink"]} ${
                                        path == "/qrCode" ? classes["active"] : ""
                                    }`}
                                    href={"/qrCode"}
                                >
                                    {translations[leng]["qr"]}
                                </Link>
                                <Link
                                    className={`${classes["toolsLink"]} ${
                                        path == "/compress" ? classes["active"] : ""
                                    }`}
                                    href={"/compress"}
                                >
                                    {translations[leng]["image_comp"]}
                                </Link>

                                <Link
                                    className={`${classes["toolsLink"]} ${
                                        path == "/removeBg" ? classes["active"] : ""
                                    }`}
                                    href={"/removeBg"}
                                >
                                    {translations[leng]["remove_bg"]}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <span
                    className={`${classes["getWebsite"]} ${
                        path == "/calculator" ? classes["active"] : ""
                    }`}
                    onClick={() => setOrder(true)}
                    // href={"/calculator"}
                >
                    {translations[leng]["menu"]["get_website"]}
                </span>
                <Link
                    href={JWT || session?.data?.user ? "/profile" : "registration"}
                    className={classes["userIcon"]}
                >
                    <Image
                        width={56}
                        height={56}
                        alt={"user"}
                        src={getImage()}
                        className={classes.userAvatar}
                    />
                </Link>
                <div className={classes["left_side"]}>
                    <SelectLanguage />
                </div>
            </div>
            {order && <OrderNow onclose={() => setOrder(false)} />}
        </nav>
    );
};

export default MenuLinks;
