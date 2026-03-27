"use client";
import classes from "./menu.module.scss";
import { FC, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdClose } from "react-icons/io";
import MenuLinks from "./components/links";
import MobileMenu from "./components/mobileMenu";
import { useSession } from "next-auth/react";
import { setCookie } from "cookies-next/client";

const Menu: FC = () => {
    const path = usePathname();

    const nfc = path.split("/").includes("nfc");

    //    ${path.split("/").length === 3 && nfc && classes["hidden"]}
    const session = useSession();

    // useEffect(() => {
    //     if (session?.data?.backendToken) {
    //         setCookie("JWT", session.data?.backendToken);
    //     }
    // }, [session]);

    return (
        <header
            className={`${classes["header"]} ${
                path.split("/").length === 3 && nfc && classes["hidden"]
            }`}
            onClick={(e) => {
                e.preventDefault();
            }}
        >
            <div className={`${classes["container"]} `}>
                <MenuLinks />
            </div>
            <MobileMenu />
        </header>
    );
};

export default Menu;
