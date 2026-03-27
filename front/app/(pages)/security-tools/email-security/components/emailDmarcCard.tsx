import { DmarcAnalysis, POLICY_COLOR } from "./emailSecurityTypes";
import { StatusIcon, IssueList, RecList, RawRecord, NotFound } from "./emailShared";
import classes from "../style/emailDmarcCard.module.scss";
import cardClasses from "../style/emailCard.module.scss";

interface EmailDmarcCardProps {
    dmarc: DmarcAnalysis;
}

export function EmailDmarcCard({ dmarc }: EmailDmarcCardProps) {
    return (
        <div className={cardClasses.card}>
            <div className={cardClasses.header}>
                <StatusIcon ok={dmarc.found && dmarc.policy !== "none"} />
                <h2 className={cardClasses.title}>DMARC Record</h2>
                {dmarc.policy && (
                    <span
                        className={cardClasses.badge}
                        style={{
                            color: POLICY_COLOR[dmarc.policy],
                            borderColor: POLICY_COLOR[dmarc.policy] + "40",
                        }}
                    >
                        p={dmarc.policy}
                    </span>
                )}
            </div>

            {dmarc.raw ? (
                <RawRecord value={dmarc.raw} />
            ) : (
                <NotFound text="No DMARC record found" />
            )}

            {dmarc.found && (
                <div className={classes.grid}>
                    <DmarcItem
                        label="Policy"
                        value={dmarc.policy ?? "—"}
                        color={POLICY_COLOR[dmarc.policy ?? "none"]}
                    />
                    {dmarc.subdomainPolicy && (
                        <DmarcItem label="Subdomain policy" value={dmarc.subdomainPolicy} />
                    )}
                    <DmarcItem label="Coverage" value={`${dmarc.percentage ?? 100}%`} />
                    <DmarcItem label="SPF alignment" value={dmarc.alignment.spf ?? "relaxed"} />
                    <DmarcItem label="DKIM alignment" value={dmarc.alignment.dkim ?? "relaxed"} />
                    <DmarcItem
                        label="Reports (rua)"
                        value={dmarc.rua.length > 0 ? dmarc.rua.join(", ") : "—"}
                    />
                </div>
            )}

            <IssueList issues={dmarc.issues} />
            <RecList recommendations={dmarc.recommendations} />
        </div>
    );
}

function DmarcItem({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div className={classes.item}>
            <span className={classes.label}>{label}</span>
            <span className={classes.value} style={color ? { color } : {}}>
                {value}
            </span>
        </div>
    );
}
