import classes from "./errorMessage.module.scss";
import { FC } from "react";
import { Message } from "@/app/types/types";

interface Props {
    message: Message;
}

const ErrorMessage: FC<Props> = ({ message: { type = false, text } }) => {
    return (
        <div className={classes[text ? "message-open" : "message-close"]}>
            <span className={classes[type ? "success-text" : "error-text"]}>{text}</span>
        </div>
    );
};

export default ErrorMessage;
