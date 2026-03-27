"use client";

import { FC, memo, useEffect, ReactNode } from "react";
import styles from "./alertBox.module.scss";
import Link from "next/link";

interface AlertBoxProps {
    type: string;
    link?: string;
    text?: string;
    title?: string;
    message: string | ReactNode;

    isVisible: boolean;

    onClose: () => void;

    duration?: number;

    className?: string;

    style?: React.CSSProperties;

    position?: "top" | "bottom" | "center";

    role?: string;

    dataTestId?: string;

    onSuccess?: () => void;
}

const AlertBox: FC<AlertBoxProps> = memo(
    ({
        type,
        title = "title",
        link = "#",
        text = "go",
        message,
        isVisible,
        onClose,
        duration = 0,
        className = "",
        style,
        position = "center",
        role = "alert",
        dataTestId = "alert-box",
        onSuccess,
    }) => {
        useEffect(() => {
            if (!duration || !isVisible) return;
            const timer = setTimeout(() => {
                onClose();
                if (type === "success" && onSuccess) onSuccess();
            }, duration);
            return () => clearTimeout(timer);
        }, [duration, isVisible, onClose, type, onSuccess]);

        const alertClasses = [
            styles.alertBox,
            isVisible ? "" : styles.hidden,
            type === "success" ? styles.success : styles.error,
            position === "top" ? styles.top : position === "bottom" ? styles.bottom : styles.center,
            className,
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <div
                className={alertClasses}
                style={style}
                role={role}
                aria-live="polite"
                aria-hidden={!isVisible}
                data-testid={dataTestId}
            >
                <button
                    className={styles.closeButton}
                    onClick={() => {
                        onClose();
                        if (type === "success" && onSuccess) onSuccess();
                    }}
                    aria-label="Close alert"
                    data-testid={`${dataTestId}-close`}
                >
                    <img src="/icons/close.png" alt="" />
                </button>

                <div className={styles.text_container}>
                    <h2>{title}</h2>

                    <span className={styles.message}>{message}</span>
                </div>

                <Link className={styles.link} href={link}>
                    {text}
                </Link>
            </div>
        );
    }
);

AlertBox.displayName = "AlertBox";

export default AlertBox;
