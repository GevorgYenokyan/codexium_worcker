import classes from "./errorBox.module.scss";

interface ErrorBoxProps {
    message: string;
}

export function ErrorBox({ message }: ErrorBoxProps) {
    return <div className={classes.errorBox}>{message}</div>;
}
