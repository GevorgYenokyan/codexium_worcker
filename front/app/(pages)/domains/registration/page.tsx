import classes from "./page.module.scss";
import { FC } from "react";
import Index from "./components";
import Image from "next/image";

const Registration: FC = () => {
    return (
        <div className={classes.container}>
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
    );
};

export default Registration;
