"use client";

import { usePathname } from "next/navigation";
import classes from "../style/mobileMenu.module.scss";
import { FC, useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
import Link from "next/link";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { FaChevronDown } from "react-icons/fa6";
import SelectLanguage from "./selectLanguage";
import Image from "next/image";
import { getCookie } from "cookies-next/client";
import OrderNow from "./orderNow";
import { useSession } from "next-auth/react";

const MobileMenu: FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const leng = useAppSelector((state) => state.translation.leng);
    const [order, setOrder] = useState(false);
    const path = usePathname();

    let JWT = getCookie("isLoggedIn");
    const session = useSession();

    const handleMenuclick = () => {
        setIsOpen(false);
    };

    useEffect(() => {
        if (document.body.offsetWidth < 1100) {
            handleMenuclick();
        }
    }, [path]);

    useEffect(() => {
        const handleBodyClick = (e: MouseEvent) => {
            if (!e.target) return;
            const target = e.target as HTMLElement;

            if (!target.closest(`.${classes["container"]}`)) {
                setIsOpen(false);
            }
        };

        document.body.addEventListener("click", handleBodyClick);

        return () => {
            document.body.removeEventListener("click", handleBodyClick);
        };
    }, []);

    const getImage = () => {
        if (session.status === "loading") return "/icons/User.svg";

        if (session?.data && session?.data?.user?.image) {
            return session?.data?.user.image;
        }
        return JWT ? "/icons/user.png" : "/icons/User.svg";
    };

    return (
        <div
            className={classes.container}
            onClick={(e) => {
                e.preventDefault();
            }}
        >
            <div
                className={classes["burger_menu"]}
                onClick={(e) => {
                    setIsOpen(!isOpen);
                }}
            >
                {isOpen ? (
                    <IoMdClose className={classes["menu_icon"]} />
                ) : (
                    <GiHamburgerMenu className={classes["menu_icon"]} />
                )}
            </div>

            <Link className={`${classes["nav_link_logo"]} `} href={"/"}>
                <Image src={"/icons/logo.png"} alt="logo" width={60} height={51} />
            </Link>
            <div className={`${classes["draWer"]} ${isOpen && classes["open"]}`}>
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
                    </div>
                </div>
                <div className={classes["dropdownTools"]}>
                    <button className={`${classes["nav_link"]} ${classes["dropbtn"]} `}>
                        {translations[leng]["tools"]}{" "}
                        <FaChevronDown className={classes["arrowDown"]} />
                    </button>
                    <div className={classes["dropdown-content"]}>
                        <Link
                            className={`${classes["dropdownLinks"]} ${
                                path == "/qrCode" ? classes["active"] : ""
                            }`}
                            href={`/qrCode`}
                        >
                            {translations[leng]["qr"]}
                        </Link>
                        <Link
                            className={`${classes["dropdownLinks"]} ${
                                path == "/smm" ? classes["active"] : ""
                            }`}
                            href={`/compress`}
                        >
                            {translations[leng]["image_comp"]}
                        </Link>

                        <Link
                            className={`${classes["dropdownLinks"]} ${
                                path == "/removeBg" ? classes["active"] : ""
                            }`}
                            href={`/removeBg`}
                        >
                            {translations[leng]["remove_bg"]}
                        </Link>
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
                        alt={"user"}
                        height={56}
                        src={getImage()}
                        className={classes.userAvatar}
                    />
                </Link>
                <SelectLanguage />
            </div>
            {order && <OrderNow onclose={() => setOrder(false)} />}
        </div>
    );
};

export default MobileMenu;
