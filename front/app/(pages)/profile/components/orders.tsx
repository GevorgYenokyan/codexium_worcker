"use client";
import { FC, useMemo } from "react";
import { useGetUserByIdQuery } from "@/app/redux/features/api/codexiumApi";
import { useAppSelector } from "@/app/redux/reduxHuks";
import classes from "../style/orders.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";

interface NFCItem {
    id: number;
    status: string;
}

interface OrderItem {
    id: number;
    status: string;
}

interface UserData {
    nfc: NFCItem[];
    orders: OrderItem[];
}

const Orders: FC = () => {
    const { data } = useGetUserByIdQuery({});
    const lang = useAppSelector((state) => state.translation.leng);

    const nfcStats = useMemo(() => {
        const nfc = data?.nfc || [];
        const active = nfc.filter((item: NFCItem) => item.status !== "completed").length;
        const completed = nfc.filter((item: NFCItem) => item.status === "completed").length;
        return { active, completed, total: nfc.length };
    }, [data]);

    const websiteStats = useMemo(() => {
        const orders = data?.orders || [];
        const active = orders.filter((item: OrderItem) => item.status !== "completed").length;
        const completed = orders.filter((item: OrderItem) => item.status === "completed").length;
        return { active, completed, total: orders.length };
    }, [data]);


    return (
        <div className={classes.orders}>
            <div className={classes.header}>
                <h3>{translations[lang]["My orders"]}</h3>
                <p>{translations[lang]["maneage_orders"]}</p>
            </div>

            <div className={classes.cards}>
                {/* NFC Business Cards */}
                <div className={classes.card}>
                    <div className={classes.cardHeader}>
                        <div className={classes.icon}>
                            <img src="/icons/nfcOrder.png" alt="NFC" />
                        </div>
                        <div className={classes.card_title}>
                            <h3>{translations[lang]["nfc_card"]}</h3>
                            <p>{translations[lang]["nfc_technology"]}</p>
                        </div>
                        <span className={classes.badge}>
                            {nfcStats.total} {translations[lang]["orders"]}
                        </span>
                    </div>
                    <div className={classes.statusRow}>
                        <div className={classes.statusBox}>
                            <span className={classes.active}>{nfcStats.total}</span>
                            <p> {translations[lang]["Active"]}</p>
                        </div>
                        <div className={classes.statusBox}>
                            <span>{nfcStats.completed}</span>
                            <p> {translations[lang]["Completed"]}</p>
                        </div>
                    </div>
                </div>

                {/* Websites */}
                <div className={classes.card}>
                    <div className={classes.cardHeader}>
                        <div className={classes.icon}>
                            <img src="/icons/webOrder.png" alt="Website" />
                        </div>
                        <div className={classes.card_title}>
                            <h3>{translations[lang]["websites"]}</h3>
                            <p>{translations[lang]["Custom_website"]}</p>
                        </div>
                        <span className={classes.badge}>
                            {websiteStats.total} {translations[lang]["orders"]}
                        </span>
                    </div>
                    <div className={classes.statusRow}>
                        <div className={classes.statusBox}>
                            <span className={classes.active}>{websiteStats.active}</span>
                            <p>{translations[lang]["Active"]}</p>
                        </div>
                        <div className={classes.statusBox}>
                            <span>{websiteStats.completed}</span>
                            <p>{translations[lang]["Completed"]}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Orders;
