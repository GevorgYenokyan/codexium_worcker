import {FC} from 'react'
import WebDev from './components/webdev'
import classes from "./page.module.scss";
import Image from "next/image";
const WebDevelopment:FC = () => {
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
      <WebDev />
    </div>
  );
}

export default WebDevelopment