import classes from "./status.module.scss";

export type StatusType = "pass" | "fail" | "warning" | "info" | "present" | "missing";

interface StatusDotProps {
    status: StatusType;
    className?: string;
}

export function StatusDot({ status, className = "" }: StatusDotProps) {
    return <span className={`${classes.dot} ${classes[`dot_${status}`]} ${className}`} />;
}

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
    const text = label ?? status;
    return <span className={`${classes.badge} ${classes[`badge_${status}`]}`}>{text}</span>;
}
