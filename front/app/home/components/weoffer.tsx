"use client";
import { FC, useState } from "react";
import classes from "../styles/weoffer.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Link from "next/link";
import { ReactTyped } from "react-typed";

const WeOffer: FC = () => {
  const leng = useAppSelector((state) => state.translation.leng);

  return (
    <div className={classes["weOffer"]}>
      <h2>
        <span className={classes["line"]}></span>
        <b>
          <ReactTyped
            strings={[`${translations[leng]["we_offer"]}`]}
            typeSpeed={40}
            className={classes.line1}
            showCursor={true}
            startWhenVisible
          />
        </b>
      </h2>
      <div className={classes["offerContainer"]}>
        <div>
          <Link href={"/webdevelopment"} className={classes["offerElem"]}>
            <div className={classes["offer"]}>
              <div className={classes["round"]}>
                <div className={classes["border"]}></div>
              </div>
              <h3>{translations[leng]["menu"]["websites"]}</h3>
            </div>
          </Link>
        </div>
        <div>
          <Link href={"/appdevelopment"} className={classes["offerElem"]}>
            <div className={classes["offer"]}>
              <div className={classes["round"]}>
                <div className={classes["border"]}></div>
              </div>
              <h3>{translations[leng]["menu"]["app"]}</h3>
            </div>
          </Link>
        </div>
        <div>
          <Link href={"/smm"} className={classes["offerElem"]}>
            <div className={classes["offer"]}>
              <div className={classes["round"]}>
                <div className={classes["border"]}></div>
              </div>
              <h3>{translations[leng]["menu"]["SMM"]}</h3>
            </div>
          </Link>
        </div>
        <div>
          <Link href={"/nfcBusiness"} className={classes["offerElem"]}>
            <div className={classes["offer"]}>
              <div className={classes["round"]}>
                <div className={classes["border"]}></div>
              </div>
              <h3>{translations[leng]["menu"]["NFC"]}</h3>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WeOffer;
