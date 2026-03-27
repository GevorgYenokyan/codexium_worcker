import classes from "../style/nfcSettings.module.scss";
import { User } from "@/app/types/types";
import React, { FC } from "react";
import SmallCard from "./smallCard";
import { ReactTyped } from "react-typed";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";

interface Props {
    data: User;
}

const NfcSettings: FC<Props> = ({ data }) => {
    const lang = useAppSelector((state) => state.translation.leng);
    const list = data?.nfc?.map((el, i) => {
        return <SmallCard key={el.id} position={el.profession} name={el.name} id={el.id} />;
    });

    return (
        <div className={classes.nfc_cards}>
            <div className={classes.cards_list}>{list}</div>
            <h2>
                <span className={classes["line"]}></span>
                <b>
                    <ReactTyped
                        strings={[`${translations[lang]["click_card"]}`]}
                        typeSpeed={40}
                        className={classes.line1}
                        showCursor={true}
                        startWhenVisible
                    />
                </b>
            </h2>
        </div>
    );
};

export default NfcSettings;
