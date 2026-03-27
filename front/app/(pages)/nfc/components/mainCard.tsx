"use client";
import { FC } from "react";
import classes from "../style/mainCard.module.scss";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import NfcForm from "./form";
import { ReactTyped } from "react-typed";

const MainCard: FC = () => {
    const lang = useAppSelector((state) => state.translation.leng);

    return (
        <div className={classes.mainCard}>
            <div>
                <h2>
                    <span className={classes["line"]}></span>
                    <b>
                        <ReactTyped
                            strings={[`${translations[lang]["menu"]["nfc"]}`]}
                            typeSpeed={40}
                            className={classes.line1}
                            showCursor={true}
                            startWhenVisible
                        />
                    </b>
                </h2>
                <div>
                    <NfcForm />
                </div>
            </div>
        </div>
    );
};

export default MainCard;
