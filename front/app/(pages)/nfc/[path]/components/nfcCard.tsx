"use client";

import React, { FC } from "react";
import classes from "../style/nfcCard.module.scss";
import { useGetNfcQuery } from "@/app/redux/features/api/codexiumApi";
import Image from "next/image";
import {
    FaLinkedin,
    FaSquareInstagram,
    FaSquareFacebook,
    FaSquareEnvelope,
    FaGlobe,
    FaSquarePhone,
    FaTelegram,
} from "react-icons/fa6";
import { FaWhatsappSquare, FaBehance } from "react-icons/fa";
import { PiDownloadSimpleLight } from "react-icons/pi";

interface NfcType {
    id: number;
    userId: number;
    path: string;
    name: string;
    profession: string;
    website: string;
    phone: string;
    viber: string;
    telegram: string;
    whatsapp: string;
    facebook: string;
    linkedin: string;
    description: string;
    instagram: string;
    behance: string;
    email: string;
    color: string;
    font: string;
    image: string;
    logo: null;
}

interface Props {
    path: string;
}

const NfcCard: FC<Props> = ({ path }) => {
    const { data } = useGetNfcQuery({
        filter: JSON.stringify({ path }),
    });

    const splitDescription = (description: string) => {
        return description.split("\n");
    };

    const nfcInfo: NfcType | undefined = data?.message?.[0];

    return (
        <div className={classes["container"]}>
            <div className={classes["nfc"]}>
                <Image
                    src="/icons/left.svg"
                    width={200}
                    height={320}
                    alt="arrow"
                    className={classes["right"]}
                    priority
                />
                <Image
                    src="/icons/right.svg"
                    width={200}
                    height={320}
                    alt="arrow"
                    className={classes["left"]}
                    priority
                />
                <div className={classes["image"]}>
                    <Image
                        src={`https://codexium.it/${nfcInfo?.image}`}
                        width={300}
                        height={300}
                        alt={`${nfcInfo?.name}`}
                        priority
                    />
                </div>
                <h2>{nfcInfo?.name}</h2>
                <p className={classes["prof"]}>{nfcInfo?.profession}</p>
                <div className={classes["description"]}>
                    {nfcInfo?.description &&
                        nfcInfo.description
                            .split("\\n")
                            .map((line, index) => <p key={index}>{line}</p>)}
                </div>
                <p className={classes["contact"]}>Contacts</p>
                <div className={classes["contactsContainer"]}>
                    <a href={`tel:${nfcInfo?.phone}`}>
                        <FaSquarePhone />
                    </a>
                    {nfcInfo?.telegram && (
                        <a href={`https://t.me/${nfcInfo?.telegram}`} target={"_blank"}>
                            <FaTelegram />
                        </a>
                    )}

                    {nfcInfo?.whatsapp && (
                        <a href={`https://api.whatsapp.com/send/?phone=${nfcInfo?.whatsapp}`}>
                            <FaWhatsappSquare />
                        </a>
                    )}
                    <a href={`mailto:${nfcInfo?.email}`}>
                        <FaSquareEnvelope />
                    </a>
                    <a href={nfcInfo?.linkedin} target={"blank"}>
                        <FaLinkedin />
                    </a>
                    {nfcInfo?.facebook && (
                        <a href={nfcInfo?.facebook} target={"blank"}>
                            <FaSquareFacebook />
                        </a>
                    )}
                    {nfcInfo?.instagram && (
                        <a href={nfcInfo?.instagram} target={"blank"}>
                            <FaSquareInstagram />
                        </a>
                    )}
                    {nfcInfo?.behance && (
                        <a href={nfcInfo?.behance} target={"blank"}>
                            <FaBehance />
                        </a>
                    )}
                </div>
                <p>{""}</p>
                {/* <p className={classes["contact"]}>Tap to save contact to your device</p>
                <div className={classes["devices"]}>
                    <div className={classes["device"]}>
                        <a href="" className={classes["download"]}>
                            <PiDownloadSimpleLight />
                        </a>
                        <span>IOS</span>
                    </div>
                    <div className={classes["device"]}>
                        <a href="" className={classes["download"]}>
                            <PiDownloadSimpleLight />
                        </a>
                        <span>Android</span>
                    </div>
                </div> */}

                <a className={classes["website"]} href={nfcInfo?.website} target={"blank"}>
                    {nfcInfo?.website}
                </a>
            </div>
        </div>
    );
};

export default NfcCard;
