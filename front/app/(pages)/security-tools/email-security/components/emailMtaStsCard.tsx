import { MtaStsAnalysis } from "./emailSecurityTypes";
import { StatusIcon } from "./emailShared";
import classes from "../style/emailMtaStsCard.module.scss";
import cardClasses from "../style/emailCard.module.scss";

interface EmailMtaStsCardProps {
    mtaSts: MtaStsAnalysis;
}

export function EmailMtaStsCard({ mtaSts }: EmailMtaStsCardProps) {
    const modeColor = mtaSts.mode === "enforce" ? "#4bb749" : "#ffc107";

    return (
        <div className={cardClasses.card}>
            <div className={cardClasses.header}>
                <StatusIcon ok={mtaSts.found && mtaSts.mode === "enforce"} />
                <h2 className={cardClasses.title}>MTA-STS</h2>
                {mtaSts.found && mtaSts.mode && (
                    <span
                        className={cardClasses.badge}
                        style={{ color: modeColor, borderColor: modeColor + "40" }}
                    >
                        {mtaSts.mode}
                    </span>
                )}
            </div>

            {!mtaSts.found ? (
                <p className={classes.notFound}>
                    MTA-STS not configured — transport security not enforced
                </p>
            ) : (
                <p className={classes.ok}>
                    MTA-STS is active in <b>{mtaSts.mode}</b> mode
                </p>
            )}
        </div>
    );
}
