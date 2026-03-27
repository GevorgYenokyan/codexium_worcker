"use client";
import { FC } from "react";
import classes from "../page.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Image from "next/image";
import { ReactTyped } from "react-typed";

const WebDev = () => {
  const leng = useAppSelector((state) => state.translation.leng);
  return (
    <div>
      <div className={classes["container"]}>
        <h2>
          <span className={classes["line"]}></span>
          <b>
            <ReactTyped
              strings={[`${translations[leng]["apptitle"]}`]}
              typeSpeed={40}
              className={classes.line1}
              showCursor={true}
              startWhenVisible
            />
          </b>
        </h2>

        <p className={classes["subTitle"]}>
          {translations[leng]["webSubTitleText"]}
        </p>
        <div className={classes["description"]}>
          <p className={classes["desc"]}>{translations[leng]["webText"][0]}</p>
          <p className={classes["desc"]}>{translations[leng]["webText"][1]}</p>
          <h2>
            <p>{translations[leng]["process"]}</p>
          </h2>
          <div className={classes["processContainer"]}>
            {translations[leng]["processItems"].map((el: any, i: number) => {
              return (
                <div key={i} className={classes["process"]}>
                  <div className={classes["processItem"]}>
                    <h4>{el.title}</h4>
                    <p>{el.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <h5>{translations[leng]["whyChoose"]}</h5>

          <div className={classes["chooseContainer"]}>
            {translations[leng]["whyChooseItems"].map(
              (el: string, i: number) => {
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
              }
            )}
          </div>
        </div>
      </div>

      <div className={classes["business"]}>
        <p className={classes["businessContainer"]}>
          {translations[leng]["yourBusiness"]}
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

export default WebDev;
