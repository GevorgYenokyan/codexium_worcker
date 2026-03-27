import { SpfAnalysis, SPF_COLOR } from "./emailSecurityTypes";
import { StatusIcon, IssueList, RecList, RawRecord, NotFound } from "./emailShared";
import classes from "../style/emailSpfCard.module.scss";
import cardClasses from "../style/emailCard.module.scss";

interface EmailSpfCardProps {
    spf: SpfAnalysis;
}

export function EmailSpfCard({ spf }: EmailSpfCardProps) {
    return (
        <div className={cardClasses.card}>
            <div className={cardClasses.header}>
                <StatusIcon ok={spf.result === "pass"} />
                <h2 className={cardClasses.title}>SPF Record</h2>
                <span
                    className={cardClasses.badge}
                    style={{
                        color: SPF_COLOR[spf.result],
                        borderColor: SPF_COLOR[spf.result] + "40",
                    }}
                >
                    {spf.result.toUpperCase()}
                </span>
            </div>

            {spf.raw ? <RawRecord value={spf.raw} /> : <NotFound text="No SPF record found" />}

            {spf.mechanisms.length > 0 && (
                <div className={classes.mechanisms}>
                    {spf.mechanisms.map((m, i) => (
                        <span
                            key={i}
                            className={`${classes.mech} ${/^-?all$/i.test(m) ? classes.mechAll : ""}`}
                        >
                            {m}
                        </span>
                    ))}
                </div>
            )}

            <IssueList issues={spf.issues} />
            <RecList recommendations={spf.recommendations} />
        </div>
    );
}
