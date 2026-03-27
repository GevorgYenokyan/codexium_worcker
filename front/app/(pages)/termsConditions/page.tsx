import {FC} from 'react'
import classes from "./page.module.scss";
import Image from "next/image";
import Info from './components/info';

const Page:FC = () => {
  return (
    <div className={classes["terms"]}>
      <Image
        src="/icons/left.svg"
        width={200}
        height={320}
        alt="arrow"
        className={classes["right"]}
        priority
      />
      <Info />
    </div>
  )
}

export default Page