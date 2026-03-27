// components/Button/Loading.tsx
import styles from "./loading.module.scss";
import { FC } from "react";

interface LoadingProps {
    size?: number;
    color?: string;
}

export const Loading: FC<LoadingProps> = ({ size = 24, color = "currentColor" }) => {
    return (
        <span className={styles.loader} style={{ width: size, height: size }}>
            <svg viewBox="0 0 50 50" className={styles.spinner}>
                <circle
                    className={styles.path}
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                />
            </svg>
        </span>
    );
};

export default Loading;
