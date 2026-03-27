"use client";

import { FC, useState, useCallback, ChangeEvent, useMemo } from "react";
import imageCompression from "browser-image-compression";
import classes from "./page.module.scss";
import ImageCompressor from "./components/compressor";
import Image from "next/image";

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
            <ImageCompressor />
        </div>
    );
};

export default Page;
