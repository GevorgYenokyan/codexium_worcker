"use client";
import { FC } from "react";
import classes from "../styles/page.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Image from "next/image";
import { ReactTyped } from "react-typed";
const Ai: FC = () => {
  const lang = useAppSelector((state) => state.translation.leng);

  return (
    <div className={classes["ai"]}>
      <h2>
        <span className={classes["line"]}></span>
        <b>
          {/* <span className={classes["green"]}>
            {translations[lang]["about"]["ai"]}
          </span>{" "} */}
          <ReactTyped
            strings={[`${translations[lang]["about"]["success"]}`]}
            typeSpeed={40}
            className={classes.line1}
            startWhenVisible
            shuffle
            showCursor={true}
          />
        </b>
      </h2>
      <div className={classes["aiContainer"]}>
        <div className={classes["aleft"]}>
          <div className={classes["image"]}>
            <Image
              src="/icons/ai.svg"
              width={300}
              height={300}
              priority
              alt="codexiumTeam"
            />
          </div>
        </div>
        <div className={classes["aright"]}>
          <p>{translations[lang]["about"]["ai"]}</p>
          <p>{translations[lang]["about"]["aiText"]}</p>
          <div className={classes["icons"]}>
            <Image
              src="/icons/partners/5.svg"
              width={120}
              height={47}
              priority
              alt="codexiumTeam"
            />
            <Image
              src="/icons/partners/3.svg"
              priority
              width={120}
              height={47}
              alt="codexiumTeam"
            />
            <Image
              src="/icons/partners/1.svg"
              width={120}
              priority
              height={47}
              alt="codexiumTeam"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ai;
