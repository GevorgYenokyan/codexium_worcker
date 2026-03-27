import { DkimSelector } from "./emailSecurityTypes";
import { StatusIcon, IssueList } from "./emailShared";
import classes from "../style/emailDkimCard.module.scss";
import cardClasses from "../style/emailCard.module.scss";

interface EmailDkimCardProps {
    dkim: DkimSelector[];
}

export function EmailDkimCard({ dkim }: EmailDkimCardProps) {
    const found = dkim.filter((d) => d.found);

    return (
        <div className={cardClasses.card}>
            <div className={cardClasses.header}>
                <StatusIcon ok={found.length > 0} />
                <h2 className={cardClasses.title}>DKIM Records</h2>
                <span className={classes.count}>{found.length} selector(s) found</span>
            </div>

            {found.length === 0 ? (
                <p className={classes.notFound}>No DKIM selectors found in common locations</p>
            ) : (
                <div className={classes.list}>
                    {found.map((sel) => (
                        <div key={sel.selector} className={classes.entry}>
                            <div className={classes.entryTop}>
                                <span className={classes.selector}>{sel.selector}._domainkey</span>
                                {sel.keyType && (
                                    <span className={classes.keyType}>
                                        {sel.keyType.toUpperCase()}
                                    </span>
                                )}
                                {sel.keyBits && (
                                    <span
                                        className={`${classes.keyBits} ${sel.keyBits < 2048 ? classes.keyWeak : classes.keyOk}`}
                                    >
                                        {sel.keyBits} bits
                                    </span>
                                )}
                            </div>
                            <IssueList issues={sel.issues} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
