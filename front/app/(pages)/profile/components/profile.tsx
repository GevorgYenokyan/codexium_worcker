"use client";
import { useGetUserByIdQuery } from "@/app/redux/features/api/codexiumApi";
import Link from "next/link";
import { FC, useState } from "react";
import Navbar from "./navbar";
import { User } from "@/app/types/types";
import UserSettings from "./userSettings";
import classes from "../style/profile.module.scss";
import Orders from "./orders";
import { IoMdClose } from "react-icons/io";
import { GiHamburgerMenu } from "react-icons/gi";
import NfcSettings from "./nfcSettings";

const Profile: FC = () => {
    const { data } = useGetUserByIdQuery({});
    const [index, setIndex] = useState(1);
    const [visible, setVisible] = useState(false);
    const user: User = data && data;

    const onclose = () => {
        setVisible(false);
    };
    const items = [
        <UserSettings data={data} key={1} />,
        <Orders key={2} />,
        <NfcSettings key={3} data={user} />,
    ];

    return (
        <div className={classes.container}>
            <div
                className={classes["burger_menu"]}
                onClick={(e) => {
                    setVisible(!visible);
                }}
            >
                {visible ? (
                    <IoMdClose className={classes["menu_icon"]} />
                ) : (
                    <GiHamburgerMenu className={classes["menu_icon"]} />
                )}
            </div>
            <div className={`${classes.navbar} ${visible && classes.isVisible}`}>
                <Navbar index={index} setIndex={setIndex} onclose={onclose} user={data} />
            </div>
            <div className={classes.items}>{items[index]}</div>
        </div>
    );
};

export default Profile;
