"use client";
import styles from "./button.module.scss";
import { FC } from "react";
import { BaseButton } from "./baseButton";
import { ButtonProps } from "@/app/types/types";
import Loading from "@/app/components/loading/loading";

export const Button: FC<ButtonProps> = ({
    variant = "primary",
    size = "md",
    disabled = false,
    onClick,
    ref,
    children,
    icon,
    loading = false,
    className,
}) => {
    const classes = [
        styles.button,
        styles[variant],
        styles[`size-${size}`],
        disabled && styles.disabled,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    const renderIcon = () => {
        if (icon && !loading) {
            return icon;
        } else if (loading) {
            return (
                <div style={{ width: 30, height: 30 }}>
                    <Loading />
                </div>
            );
        }
    };

    return (
        <BaseButton className={classes} disabled={disabled} onClick={onClick} ref={ref}>
            {renderIcon()}
            {children}
        </BaseButton>
    );
};
