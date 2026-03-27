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
    data: NfcType | any;
}

const NfcCard: FC<Props> = ({ data }) => {
    const splitDescription = (description: string) => {
        return description.split("\n");
    };

    const nfcInfo: NfcType = data;


    return (
        <div className={classes["card_container"]}>
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
                    <img
                        src={`${nfcInfo?.image}`}
                        width={300}
                        height={300}
                        alt={`${nfcInfo?.name}`}
                        // priority
                    />
                </div>
                <h2 style={{ color: nfcInfo.color }}>{nfcInfo?.name}</h2>
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
                        <FaSquarePhone style={{ color: nfcInfo.color }} />
                    </a>
                    {nfcInfo?.telegram && (
                        <a href={`https://t.me/${nfcInfo?.telegram}`} target={"_blank"}>
                            <FaTelegram style={{ color: nfcInfo.color }} />
                        </a>
                    )}

                    {nfcInfo?.whatsapp && (
                        <a href={`https://api.whatsapp.com/send/?phone=${nfcInfo?.whatsapp}`}>
                            <FaWhatsappSquare />
                        </a>
                    )}
                    <a href={`mailto:${nfcInfo?.email}`}>
                        <FaSquareEnvelope style={{ color: nfcInfo.color }} />
                    </a>
                    <a href={nfcInfo?.linkedin} target={"blank"}>
                        <FaLinkedin style={{ color: nfcInfo.color }} />
                    </a>
                    {nfcInfo?.facebook && (
                        <a href={nfcInfo?.facebook} target={"blank"}>
                            <FaSquareFacebook style={{ color: nfcInfo.color }} />
                        </a>
                    )}
                    {nfcInfo?.instagram && (
                        <a href={nfcInfo?.instagram} target={"blank"}>
                            <FaSquareInstagram style={{ color: nfcInfo.color }} />
                        </a>
                    )}
                    {nfcInfo?.behance && (
                        <a href={nfcInfo?.behance} target={"blank"}>
                            <FaBehance style={{ color: nfcInfo.color }} />
                        </a>
                    )}
                </div>
                <p>{""}</p>
                <p className={classes["contact"]}>Tap to save contact to your device</p>
                <div className={classes["devices"]}>
                    <div className={classes["device"]}>
                        <a href="" className={classes["download"]}>
                            <PiDownloadSimpleLight style={{ color: nfcInfo.color }} />
                        </a>
                        <span>IOS</span>
                    </div>
                    <div className={classes["device"]}>
                        <a href="" className={classes["download"]}>
                            <PiDownloadSimpleLight style={{ color: nfcInfo.color }} />
                        </a>
                        <span>Android</span>
                    </div>
                </div>

                <a className={classes["website"]} href={nfcInfo?.website} target={"blank"}>
                    {nfcInfo?.website}
                </a>
            </div>
        </div>
    );
};

export default NfcCard;
