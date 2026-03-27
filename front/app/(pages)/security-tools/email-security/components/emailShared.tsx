import classes from "../style/emailShared.module.scss";

export function StatusIcon({ ok }: { ok: boolean }) {
    return <span className={ok ? classes.iconOk : classes.iconFail}>{ok ? "✓" : "✗"}</span>;
}

export function IssueList({ issues }: { issues: string[] }) {
    if (issues.length === 0) return null;
    return (
        <ul className={classes.issueList}>
            {issues.map((issue, i) => (
                <li key={i} className={classes.issue}>
                    ⚠ {issue}
                </li>
            ))}
        </ul>
    );
}

export function RecList({ recommendations }: { recommendations: string[] }) {
    if (recommendations.length === 0) return null;
    return (
        <ul className={classes.recList}>
            {recommendations.map((r, i) => (
                <li key={i} className={classes.rec}>
                    💡 {r}
                </li>
            ))}
        </ul>
    );
}

export function RawRecord({ value }: { value: string }) {
    return <div className={classes.rawRecord}>{value}</div>;
}

export function NotFound({ text }: { text: string }) {
    return <p className={classes.notFound}>{text}</p>;
}
