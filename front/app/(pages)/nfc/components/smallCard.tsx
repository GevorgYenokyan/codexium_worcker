import Image from "next/image";
import classes from "../style/smallCard.module.scss";
import React, { FC } from "react";

interface Props {
    name: string;
    position: string;
}
const SmallCard: FC<Props> = ({ name, position }) => {
    return (
        <div className={classes.container}>
            <div className={classes.info}>
                <h2>{name}</h2>
                <h4>{position}</h4>
            </div>

            <p>NFC Business Card</p>
            <Image
                src="/icons/nfc.png"
                width={48}
                height={48}
                alt="arrow"
                className={classes["nfc"]}
                priority
            />
            <Image
                src="/icons/right.svg"
                width={93}
                height={103}
                alt="arrow"
                className={classes["left"]}
                priority
            />
            <Image
                src="/icons/right.svg"
                width={93}
                height={103}
                alt="arrow"
                className={classes["right"]}
                priority
            />
        </div>
    );
};

export default SmallCard;
