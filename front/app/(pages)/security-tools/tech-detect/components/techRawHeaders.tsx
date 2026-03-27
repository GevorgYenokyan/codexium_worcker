import classes from "../style/techRawHeaders.module.scss";

interface TechRawHeadersProps {
    rawHeaders: Record<string, string>;
}

export function TechRawHeaders({ rawHeaders }: TechRawHeadersProps) {
    const count = Object.keys(rawHeaders).length;
    if (count === 0) return null;

    return (
        <details className={classes.block}>
            <summary className={classes.summary}>Raw HTTP headers ({count})</summary>
            <div className={classes.list}>
                {Object.entries(rawHeaders).map(([k, v]) => (
                    <div key={k} className={classes.row}>
                        <span className={classes.key}>{k}</span>
                        <span className={classes.sep}>: </span>
                        <span className={classes.val}>{v}</span>
                    </div>
                ))}
            </div>
        </details>
    );
}
