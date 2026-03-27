import React from "react";
import Profile from "./components/profile";
import Image from "next/image";
import classes from "./page.module.scss";

const Page = () => {
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
            <Profile />
        </div>
    );
};

export default Page;
