"use client";
import { FC } from "react";
import classes from "../page.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import Image from "next/image";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { div } from "@tensorflow/tfjs";
import { ReactTyped } from "react-typed";
const SmmPage = () => {
  const leng = useAppSelector((state) => state.translation.leng);
  return (
    <div>
      <div className={classes["container"]}>
        <h2>
          <span className={classes["line"]}></span>
          <b>
            <ReactTyped
              strings={[`${translations[leng]["menu"]["SMM"]}`]}
              typeSpeed={40}
              className={classes.line1}
              showCursor={true}
              startWhenVisible
            />
          </b>
        </h2>
        <p className={classes["subTitle"]}>
          {translations[leng]["smmSubtitle"]}
        </p>
        <div className={classes["description"]}>
          <p className={classes["desc"]}>{translations[leng]["smmText"][0]}</p>
          <p className={classes["desc"]}>{translations[leng]["smmText"][1]}</p>
        </div>

        <h5>{translations[leng]["smmIncludes"]}</h5>
        <div className={classes["offersContainer"]}>
          {translations[leng]["smmIncludesItems"].map((el: any, i: number) => {
            return (
              <div className={classes["offer"]} key={i}>
                <div>
                  <h6>{el.title}</h6>
                  <p>{el.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        <h5>{translations[leng]["whyChoose"]}</h5>

        <div className={classes["chooseContainer"]}>
          {translations[leng]["smmArguments"].map((el: string, i: number) => {
            return (
              <div key={i} className={classes["chooseItem"]}>
                <Image
                  src="/icons/check.svg"
                  width={32}
                  height={32}
                  alt="check"
                  className={classes["check"]}
                  priority
                />
                <p>{el}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className={classes["business"]}>
        <p className={classes["businessContainer"]}>
          {translations[leng]["smmVision"]}
        </p>
        <Image
          src="/icons/rightGreen.svg"
          width={100}
          height={100}
          alt="rightGreen"
          className={classes["rightGreen"]}
          priority
        />
      </div>
    </div>
  );
};

export default SmmPage;
