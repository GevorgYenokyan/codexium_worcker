import styles from "./input.module.scss";
import { FC, InputHTMLAttributes, RefObject } from "react";

interface BaseInputProps extends InputHTMLAttributes<HTMLInputElement> {}

interface Props extends BaseInputProps {
    ref?: RefObject<HTMLInputElement>;
}

export const BaseInput: FC<Props> = ({ ref, className, ...props }) => {
    return <input ref={ref} className={`${styles.base} ${className}`} {...props} />;
};

BaseInput.displayName = "BaseInput";
