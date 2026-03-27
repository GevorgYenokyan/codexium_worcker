"use client";

import classes from "./drawer.module.scss";
import { FC, ReactNode } from "react";
import { IoMdClose } from "react-icons/io";

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    position?: "left" | "right";
    width?: string;
}

export const Drawer: FC<DrawerProps> = ({
    isOpen,
    onClose,
    children,
    position = "right",
    width = "300px",
}) => {
    return (
        <div className={`${classes["overlay"]} ${isOpen ? classes["open"] : ""}`} onClick={onClose}>
            <div
                className={`${classes["drawer"]} ${classes[position]}`}
                style={{ width }}
                onClick={(e) => e.stopPropagation()}
            >
                <IoMdClose className={classes["closeButton"]} onClick={onClose} />
                {children}
            </div>
        </div>
    );
};
