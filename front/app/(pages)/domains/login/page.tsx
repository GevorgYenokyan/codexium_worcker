"use client";
import { FC, Suspense } from "react";
import classes from "./page.module.scss";
import Index from "./components";
import Image from "next/image";

const Login: FC = () => {
    return (
        <Suspense>
            <div className={classes["auth"]}>
                <Image
                    src="/icons/right.svg"
                    width={200}
                    height={320}
                    alt="arrow"
                    className={classes["left"]}
                    priority
                />
                <Index />
            </div>
        </Suspense>
    );
};

export default Login;
