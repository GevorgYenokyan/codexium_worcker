"use client";
import { FC } from "react";
import classes from "../styles/page.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Image from "next/image";
import { ReactTyped } from "react-typed";

const WeAre: FC = () => {
  const lang = useAppSelector((state) => state.translation.leng);
  return (
    <div className={classes["we"]}>
      <div className={classes["wleft"]}>
        <div className={classes["image"]}>
          <Image
            src="/icons/codexiumTeam.svg"
            width={300}
            height={200}
            priority
            alt="codexiumTeam"
          />
        </div>
      </div>
      <div className={classes["wright"]}>
        <div className={classes["line"]}></div>
        <p>
          <ReactTyped
            strings={[`${translations[lang]["about"]["weAre"]}`]}
            typeSpeed={40}
            className={classes.line1}
            startWhenVisible
            shuffle
            showCursor={true}
          />
        </p>
      </div>
    </div>
  );
};

export default WeAre;
