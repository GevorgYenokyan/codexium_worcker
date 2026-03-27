"use client"
import { FC } from "react";
import classes from "../page.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { ReactTyped } from "react-typed";
const Info: FC = () => {

  const leng = useAppSelector((state) => state.translation.leng);
    return (
      <div className={classes["container"]}>
        <h2>
          <span className={classes["line"]}></span>
          <b>
            <ReactTyped
              strings={[`${translations[leng]["terms"]}`]}
              typeSpeed={40}
              className={classes.line1}
              showCursor={true}
              startWhenVisible
            />
          </b>
        </h2>

        <p className={classes["subTitle"]}>
          {translations[leng]["terms_desc"]}
        </p>

        <ol className={classes["termsList"]}>
          {translations[leng]["terms_info"].map((el: any, i: any) => {
            return <li key={i}>{el}</li>;
          })}
        </ol>
      </div>
    );
};

export default Info;
