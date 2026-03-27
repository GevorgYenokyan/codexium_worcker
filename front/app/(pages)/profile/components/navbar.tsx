"use client";
import { Dispatch, FC, SetStateAction, useState } from "react";
import classes from "../style/navbar.module.scss";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { useRouter } from "next/navigation";
import { deleteCookie } from "cookies-next/client";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import ConfirmModal from "@/app/components/confirmModal/confirmModal";
import { User } from "@/app/types/types";
import { RiCloseLargeLine } from "react-icons/ri";
import { useSession, signOut } from "next-auth/react";

interface Props {
    index: number;
    setIndex: Dispatch<SetStateAction<number>>;
    onclose: () => void;
    user: User;
}

const Navbar: FC<Props> = ({ index, setIndex, onclose, user }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const lang = useAppSelector((state) => state.translation.leng);
    const router = useRouter();

    const session = useSession();

    const data = [
        {
            id: 1,
            icon: "/icons/User_settings.png",
            text: lang === "arm" ? "Հաշվի կարգավորումներ" : "Account settings",
        },

        {
            id: 2,
            icon: "/icons/orders.png",
            text: lang === "arm" ? "Պատվերները" : "My orders",
        },
        {
            id: 3,
            icon: "/icons/nfcOrder.png",
            text: lang === "arm" ? "NFC կարգավորումներ" : "NFC settings",
        },
    ];

    const list = data.map((el, i) => {
        return (
            <div
                key={el.id}
                className={`${classes.nav_item} ${index === i && classes.active}`}
                onClick={() => {
                    setIndex(i);
                    onclose();
                }}
            >
                <img src={el.icon} alt="" />
                <p>{el.text}</p>
            </div>
        );
    });

    return (
        <div className={classes["container"]}>
            {list}
            <div className={`${classes.nav_item} `} onClick={() => setIsVisible(true)}>
                <img src={"/icons/logout.png"} alt="" />
                <p>{lang === "arm" ? "Ելք" : "Log out"}</p>
            </div>
            <ConfirmModal
                isOpen={isVisible}
                onClose={() => {
                    setIsVisible(false);
                }}
                message={translations[lang]["logout_text"]}
                description={translations[lang]["logout_desc"]}
                onConfirm={() => {
                    deleteCookie("JWT");
                    deleteCookie("isLoggedIn");
                    router.push("/");
                    if (session?.data?.user) {
                        signOut({ callbackUrl: "/" });
                    }
                }}
                text={translations[lang]["Log out"]}
            />
        </div>
    );
};

export default Navbar;
