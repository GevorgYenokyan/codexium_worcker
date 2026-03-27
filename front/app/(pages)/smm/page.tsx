import { FC } from "react";
import SmmPage from "./components/app";
import classes from "./page.module.scss";
import Image from "next/image";

const Smm: FC = () => {
  return (
    <div className={classes["development"]}>
      <Image
        src="/icons/left.svg"
        width={200}
        height={320}
        alt="arrow"
        className={classes["right"]}
        priority
      />
      <SmmPage />
    </div>
  );
};

export default Smm;
