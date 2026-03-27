import classes from "../style/dnsSummaryRow.module.scss";

interface DnsSummaryRowProps {
    ok: number;
    total: number;
    typesFound: number;
    uniqueAnswerSets: number;
    propagated: boolean;
}

export function DnsSummaryRow({
    ok,
    total,
    typesFound,
    uniqueAnswerSets,
    propagated,
}: DnsSummaryRowProps) {
    return (
        <div className={classes.row}>
            <span className={classes.item}>
                <b>{ok}</b>/{total} servers
            </span>
            <span className={classes.dot}>·</span>
            <span className={classes.item}>
                <b>{typesFound}</b> types found
            </span>
            <span className={classes.dot}>·</span>
            <span className={classes.item}>
                <b>{uniqueAnswerSets}</b> unique answer(s)
            </span>
            <span className={classes.dot}>·</span>
            <span className={propagated ? classes.propTag : classes.partialTag}>
                {propagated ? "✓ Propagated" : "◑ Propagating"}
            </span>
        </div>
    );
}
