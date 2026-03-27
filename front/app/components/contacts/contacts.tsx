"use client";
import { FC, useState } from "react";
import classes from "./contacts.module.scss";
import { usePathname } from "next/navigation";

const Contacts: FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const path = usePathname();

    const nfc = path.split("/").includes("nfc");

    //    ${path.split("/").length === 3 && nfc && classes["hidden"]}

    return (
        <div
            className={`${classes["contact_us"]} ${
                path.split("/").length === 3 && nfc && classes["hidden"]
            }`}
        >
            <div className={`${classes["icons_container"]} ${isOpen && classes["open"]}`}>
                {/* <a href="tel:+306988088000" className={classes["contact_icon"]}>
                    <img src="/contacts/phone.png" alt="phone.png" />
                </a> */}

                <a
                    target={"_blank"}
                    href="mailto:codexiumit@gmail.com"
                    className={classes["contact_icon"]}
                >
                    <img src="/icons/email.png" alt="email" />
                </a>
                <a
                    target="_blank"
                    href="https://t.me/iamserine"
                    className={classes["contact_icon"]}
                >
                    <img src="/icons/telegram.png" alt="Viber" />
                </a>

                <a
                    target={"_blank"}
                    href="https://api.whatsapp.com/send/?phone=37494107694&text=Hy"
                    className={classes["contact_icon"]}
                >
                    <img src="/icons/viber.png" alt="Whatsapp.png" />
                </a>

                {/* <a href="#" className={classes["contact_icon"]}>
                    <img src="/contacts/chat.png" alt="chat.png" />
                </a> */}
            </div>

            <div onClick={() => setIsOpen(!isOpen)} className={classes["btn_container"]}>
                {isOpen ? (
                    <img
                        className={classes["contact_icon"]}
                        src="/icons/closed.png"
                        alt="contact.png"
                    />
                ) : (
                    <img
                        className={classes["contact_icon"]}
                        src="/icons/contact.png"
                        alt="contact.png"
                    />
                )}
            </div>
        </div>
    );
};

export default Contacts;
