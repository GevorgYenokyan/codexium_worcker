"use client";
import { FC, useState, useEffect } from "react";
import classes from "../styles/websiteneed.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Image from "next/image";
import Aos from "aos";
import "aos/dist/aos.css";
import { ReactTyped } from "react-typed";
const Websiteneed = () => {
    const leng = useAppSelector((state) => state.translation.leng);
    useEffect(function () {
        Aos.init({ duration: 100 });
    }, []);
    return (
      <div className={classes["need"]}>
        <h2>
          <span className={classes["line"]}></span>
          <b>
            <ReactTyped
              strings={[`${translations[leng]["need_website"]}`]}
              typeSpeed={40}
              className={classes.line1}
              showCursor={true}
              startWhenVisible
            />
          </b>
        </h2>
        <div className={classes["arrowSection"]}>
          <Image
            src={`/icons/website/arrows.svg`}
            width={100}
            alt={"arrow"}
            height={100}
            className={classes["arrows"]}
          />
          <Image
            src={`/icons/website/arrowsMobile.svg`}
            width={100}
            alt={"arrow"}
            height={100}
            className={classes["arrowMobile"]}
          />
          <div
            className={classes["globe"]}
            data-aos="fade-up"
            data-aos-duration="600"
            data-aos-anchor-placement="top-bottom">
            <div className={classes["globeImg"]}>
              <Image
                src={`/icons/website/greenGlobe.svg`}
                width={100}
                alt={"arrow"}
                height={100}
              />
            </div>

            <p>{translations[leng]["globe"]}</p>
          </div>
          <div
            className={`${classes["customers"]} ${classes["round"]}`}
            data-aos="fade-up"
            data-aos-duration="600"
            data-aos-anchor-placement="top-bottom">
            <div>
              <Image
                src={`/icons/website/customers.svg`}
                width={100}
                alt={"arrow"}
                height={100}
              />
              <p>{translations[leng]["customer"]}</p>
            </div>
          </div>

          <div
            className={`${classes["collab"]} ${classes["round"]}`}
            data-aos="fade-up"
            data-aos-duration="600"
            data-aos-anchor-placement="top-bottom">
            <div>
              <Image
                src={`/icons/website/collabs.svg`}
                width={100}
                alt={"arrow"}
                height={100}
              />
              <p>{translations[leng]["collab"]}</p>
            </div>
          </div>

          <div
            className={`${classes["popular"]} ${classes["round"]}`}
            data-aos="fade-up"
            data-aos-duration="600"
            data-aos-anchor-placement="top-bottom">
            <div>
              <Image
                src={`/icons/website/popular.svg`}
                width={100}
                alt={"arrow"}
                height={100}
              />
              <p>{translations[leng]["popular"]}</p>
            </div>
          </div>

          <div
            className={`${classes["business"]} ${classes["round"]}`}
            data-aos="fade-up"
            data-aos-duration="600"
            data-aos-anchor-placement="top-bottom">
            <div>
              <Image
                src={`/icons/website/bussiness.svg`}
                width={100}
                alt={"arrow"}
                height={100}
              />
              <p>{translations[leng]["business"]}</p>
            </div>
          </div>

          <div
            className={`${classes["money"]} ${classes["round"]}`}
            data-aos="fade-up"
            data-aos-duration="600"
            data-aos-anchor-placement="top-bottom">
            <div>
              <Image
                src={`/icons/website/money.svg`}
                width={100}
                alt={"arrow"}
                height={100}
              />
              <p>{translations[leng]["money"]}</p>
            </div>
          </div>
        </div>
      </div>
    );
};

export default Websiteneed;
