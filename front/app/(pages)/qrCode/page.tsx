"use client";

import { FC, useState } from "react";
import classes from "./page.module.scss";
import Image from "next/image";
import QrCode from "./components/qrCode";

const Page: FC = () => {
    return (
        <div className={classes.container}>
            <Image
                src="/icons/left.svg"
                width={200}
                height={320}
                alt="arrow"
                className={classes["right"]}
                priority
            />
            <QrCode />
        </div>
    );
};

export default Page;
