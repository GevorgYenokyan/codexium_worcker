import { FC, ReactNode } from "react";
import classes from "./modal.module.scss";

type WindowModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children?: ReactNode;
    actionLabel?: string;
    onAction?: () => void;
};

const WindowModal: FC<WindowModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    actionLabel = "close",
    onAction,
}) => {
    if (!isOpen) return null;

    return (
        <div className={classes["backdrop"]} onClick={onClose}>
            <div className={classes["modal"]} onClick={(e) => e.stopPropagation()}>
                {title && (
                    <div className={classes["header"]}>
                        <h2 className={classes["title"]}>{title}</h2>
                        <button
                            className={classes["closeButton"]}
                            onClick={onClose}
                            aria-label="Close"
                        >
                            &times;
                        </button>
                    </div>
                )}
                {children && <div className={classes["content"]}>{children}</div>}
                {actionLabel && onAction && (
                    <div className={classes["footer"]}>
                        <button className={classes["actionButton"]} onClick={onAction}>
                            {actionLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WindowModal;
