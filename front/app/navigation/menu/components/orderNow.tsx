import { useAppSelector } from "@/app/redux/reduxHuks";
import React, { FC } from "react";
import classes from "../style/orderNow.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import Link from "next/link";

interface Props {
    onclose: () => void;
}

const OrderNow: FC<Props> = ({ onclose }) => {
    const lang = useAppSelector((state) => state.translation.leng);

    return (
        <div className={classes.container} onClick={onclose}>
            <div className={classes.modal} onClick={(e) => e.stopPropagation()}>
                <div className={classes.title}>
                    <h2>{translations[lang]["likeToOrder"]}</h2>
                    <div className={classes.close} onClick={onclose}>
                        <img src="/icons/closeIcon.png" alt="" />
                    </div>
                </div>
                <div className={classes.order}>
                    <Link href={"/nfcOrder"} className={classes.cardHeader} onClick={onclose}>
                        <div className={classes.icon}>
                            <img src="/icons/nfcOrder.png" alt="NFC" />
                        </div>
                        <div className={classes.card_title}>
                            <h3>{translations[lang]["nfc_card"]}</h3>
                            <p>{translations[lang]["nfc_technology"]}</p>
                        </div>
                    </Link>
                    <Link href={"/calculator"} className={classes.cardHeader} onClick={onclose}>
                        <div className={classes.icon}>
                            <img src="/icons/webOrder.png" alt="Website" />
                        </div>
                        <div className={classes.card_title}>
                            <h3>{translations[lang]["websites"]}</h3>
                            <p>{translations[lang]["Custom_website"]}</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderNow;
