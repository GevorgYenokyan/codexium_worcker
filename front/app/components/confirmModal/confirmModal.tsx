import styles from "./confirmModal.module.scss";
import { useEffect } from "react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onCancel?: () => void;
    message?: string;
    description?: string;
    text?: string;
    cancel?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    onCancel,
    message = "Are you sure?",
    description = "",
    text = "Confirm",
    cancel,
}) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        if (isOpen) document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "auto";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.show : ""}`} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.close} onClick={onClose}>
                    <img src="/icons/closeIcon.png" alt="" />
                </div>
                <div className={styles.message_container}>
                    <h2 className={styles.title}>{message}</h2>
                    {description && <p>{description}</p>}
                </div>
                <div className={styles.buttonContainer}>
                    <button onClick={onConfirm}>{text}</button>
                    {cancel && (
                        <button
                            className={styles.second_btn}
                            type={"reset"}
                            onClick={() => {
                                onClose();
                                if (onCancel) {
                                    onCancel();
                                }
                            }}
                        >
                            {cancel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
