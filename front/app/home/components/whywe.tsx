"use client";
import { FC, useState } from "react";
import classes from "../styles/whywe.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Link from "next/link";
import Image from "next/image";
import { ReactTyped } from "react-typed";
const Whywe: FC = () => {
  const leng = useAppSelector((state) => state.translation.leng);

  return (
    <div className={classes["whyWe"]}>
      <h2>
        <span className={classes["line"]}></span>
        <b>
          <ReactTyped
            strings={[`${translations[leng]["why_we"]}`]}
            typeSpeed={40}
            className={classes.line1}
            showCursor={true}
            startWhenVisible
          />
        </b>
      </h2>
      <div className={classes["offerContainer"]}>
        <div className={classes["left"]}>
          <div className={classes["offerElem"]}>
            <Link href={`/blog/31`} className={classes["offer"]}>
              <div className={classes["title"]}>
                <Image
                  src={"/icons/globe.svg"}
                  width={48}
                  alt={"arrow"}
                  height={48}
                  className={classes["icon"]}
                />
                <b>{translations[leng]["why_titles"][0]}</b>
              </div>
              <p>{translations[leng]["why_texts"][0]}</p>
            </Link>
          </div>
          <div className={classes["offerElem"]}>
            <Link href={`/blog/30`} className={classes["offer"]}>
              <div className={classes["title"]}>
                <Image
                  src={"/icons/pen.svg"}
                  width={48}
                  alt={"arrow"}
                  height={48}
                  className={classes["icon"]}
                />
                <b>{translations[leng]["why_titles"][1]}</b>
              </div>
              <p>{translations[leng]["why_texts"][1]}</p>
            </Link>
          </div>
          <div className={classes["offerElem"]}>
            <Link href={`/blog/31`} className={classes["offer"]}>
              <div className={classes["title"]}>
                <Image
                  src={"/icons/personalized.svg"}
                  width={48}
                  alt={"arrow"}
                  height={48}
                  className={classes["icon"]}
                />
                <b>{translations[leng]["why_titles"][2]}</b>
              </div>
              <p>{translations[leng]["why_texts"][2]}</p>
            </Link>
          </div>
          <div className={classes["offerElem"]}>
            <Link href={`/blog/30`} className={classes["offer"]}>
              <div className={classes["title"]}>
                <Image
                  src={"/icons/security.svg"}
                  width={48}
                  alt={"arrow"}
                  height={48}
                  className={classes["icon"]}
                />
                <b>{translations[leng]["why_titles"][3]}</b>
              </div>
              <p>{translations[leng]["why_texts"][3]}</p>
            </Link>
          </div>
        </div>
        {/* <div className={classes["domain"]}>
          <Link className={classes["offer"]} href={"/comingSoon"}>
            <div className={classes["round"]}>
              <div className={classes["border"]}></div>
            </div>
            <div className={classes["title"]}>
              <Image
                src={"/icons/domain.svg"}
                width={48}
                alt={"arrow"}
                height={48}
                className={classes["icon"]}
              />
              <b>{translations[leng]["why_titles"][4]}</b>
            </div>
            <p>{translations[leng]["why_texts"][4]}</p>
          </Link>
        </div> */}
      </div>
    </div>
  );
};

export default Whywe;
