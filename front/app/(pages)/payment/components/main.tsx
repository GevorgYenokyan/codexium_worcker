"use client";
import { FC } from "react";
import classes from "../style/main.module.scss";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import Card from "./card";
import PaymentInfo from "./paymentInfo";
import { ReactTyped } from "react-typed";
const Main: FC = () => {
    const lang = useAppSelector((state) => state.translation.leng);

    return (
      <div className={classes.main}>
        <h2>
          <span className={classes["line"]}></span>
          <b>
            <ReactTyped
              strings={[`${translations[lang]["menu"]["get_website"]}`]}
              typeSpeed={40}
              className={classes.line1}
              showCursor={true}
              startWhenVisible
            />
          </b>
        </h2>

        <div className={classes.text_header}>
          <h3>{translations[lang]["deposit_title"]}</h3>
          <p>{translations[lang]["deposit_text"]}</p>
        </div>
        <div className={classes.content}>
          <Card />
          <PaymentInfo />
        </div>
      </div>
    );
};

export default Main;
