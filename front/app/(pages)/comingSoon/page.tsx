"use client";
import { FC } from "react";
import classes from "./page.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Image from "next/image";
const ComingSoon: FC = () => {
  const leng = useAppSelector((state) => state.translation.leng);

  return (
    <div className={classes["container"]}>
      <Image
        src="/icons/left.svg"
        width={200}
        height={320}
        alt="arrow"
        className={classes["right"]}
        priority
      />
      <Image
        src="/icons/rocket.svg"
        width={200}
        height={320}
        alt="rocket"
        className={classes["rocket"]}
        priority
      />
      <h2>{translations[leng]["comingSoon"]}</h2>
      <p>{translations[leng]["comingSoonText"]}</p>
    </div>
  );
};

export default ComingSoon;
