import { FC } from "react";
import App from "./components/app";
import classes from "./page.module.scss";
import Image from "next/image";

const AppDevelopment: FC = () => {
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
      <App />
    </div>
  );
};

export default AppDevelopment;
