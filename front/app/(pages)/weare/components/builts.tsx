"use client";
import { FC } from "react";
import classes from "../styles/page.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { ReactTyped } from "react-typed";
import Image from "next/image";
const Builts: FC = () => {
  const lang = useAppSelector((state) => state.translation.leng);

  return (
    <div className={classes["builts"]}>
      <h2>
        <span className={classes["line"]}></span>
        <b>

          <ReactTyped
            strings={[`${translations[lang]["about"]["together"]}`]}
            typeSpeed={40}
            className={classes.line1}
            startWhenVisible
            shuffle
            showCursor={true}
          />
        </b>
      </h2>
      <div className={classes["builtsContainer"]}>
        <div className={classes["builtsItems"]}>
          <h3>48+</h3>
          <span>{translations[lang]["about"]["collaborations"]}</span>
        </div>
        <div className={classes["builtsItems"]}>
          <h3>15+</h3>
          <span>{translations[lang]["about"]["web"]}</span>
        </div>
        <div className={classes["builtsItems"]}>
          <h3>150+</h3>
          <span>{translations[lang]["about"]["grateful"]}</span>
        </div>
      </div>
    </div>
  );
};

export default Builts;
