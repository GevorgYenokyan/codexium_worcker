"use client";
import { FC } from "react";
import classes from "../styles/trustus.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import TrustusSlider from "./trustusSlider";
import Image from "next/image";
import { ReactTyped } from "react-typed";
const Trustus: FC = () => {
  const leng = useAppSelector((state) => state.translation.leng);
  const emptyStrings = Array(22).fill("");
  let partners = emptyStrings.map((el: any, i: number): JSX.Element => {
    return (
      <Image
        key={i}
        src={`/icons/partners/${i + 1}.svg`}
        width={200}
        alt={"arrow"}
        height={88}
        className={classes["partnerImg"]}
      />
    );
  });
  return (
    <div className={classes["trustUs"]}>
      <h2>
        <span className={classes["line"]}></span>
        <b>
          <ReactTyped
            strings={[`${translations[leng]["trust"]}`]}
            typeSpeed={40}
            className={classes.line1}
            showCursor={true}
            startWhenVisible
          />
        </b>
      </h2>
      <div className={classes["partnersContainer"]}>
        {partners}
        <Image
          src={`/icons/partners/VJmotors.png`}
          width={200}
          alt={"arrow"}
          height={88}
          className={classes["partnerImg"]}
        />
      </div>
      <TrustusSlider />
    </div>
  );
};

export default Trustus;
