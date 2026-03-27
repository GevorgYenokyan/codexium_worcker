"use client";
import { FC, Suspense } from "react";
import classes from "./page.module.scss";
import RecoverPassword from "./components/recoverPassword";
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
                <RecoverPassword />
            </div>
        </Suspense>
    );
};

export default Login;
