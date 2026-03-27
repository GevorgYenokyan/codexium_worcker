import classes from "./infoGrid.module.scss";

// ─── InfoRow ──────────────────────────────────────────────────────────────────
interface InfoRowProps {
    label: string;
    value: string | null | undefined;
    link?: string;
    highlight?: "warn" | "fail";
    mono?: boolean;
}

export function InfoRow({ label, value, link, highlight, mono }: InfoRowProps) {
    if (!value) return null;

    const valueClass = [
        classes.rowValue,
        mono ? classes.rowMono : "",
        highlight === "warn" ? classes.warnText : "",
        highlight === "fail" ? classes.failText : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={classes.row}>
            <span className={classes.rowLabel}>{label}</span>
            {link ? (
                <a
                    href={link.startsWith("http") ? link : `https://${link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={classes.rowLink}
                >
                    {value}
                </a>
            ) : (
                <span className={valueClass}>{value}</span>
            )}
        </div>
    );
}

// ─── InfoGrid ─────────────────────────────────────────────────────────────────
interface InfoGridProps {
    children: React.ReactNode;
    cols?: 1 | 2;
}

export function InfoGrid({ children, cols = 2 }: InfoGridProps) {
    return (
        <div className={`${classes.grid} ${cols === 1 ? classes.grid1 : classes.grid2}`}>
            {children}
        </div>
    );
}
