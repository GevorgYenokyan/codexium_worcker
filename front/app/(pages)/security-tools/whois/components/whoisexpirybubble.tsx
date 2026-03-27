import classes from "../style/whoisExpiryBubble.module.scss";

interface WhoisExpiryBubbleProps {
    daysUntilExpiry: number;
}

interface WhoisCountryBubbleProps {
    country: string;
}

export function WhoisExpiryBubble({ daysUntilExpiry }: WhoisExpiryBubbleProps) {
    const colorClass =
        daysUntilExpiry < 0
            ? classes.expired
            : daysUntilExpiry <= 30
              ? classes.expiringSoon
              : daysUntilExpiry <= 90
                ? classes.expiringWarn
                : classes.expiringOk;

    return (
        <div className={`${classes.bubble} ${colorClass}`}>
            <span className={classes.num}>
                {daysUntilExpiry < 0 ? "Expired" : `${daysUntilExpiry}d`}
            </span>
            <span className={classes.label}>
                {daysUntilExpiry < 0 ? "Domain expired" : "until expiry"}
            </span>
        </div>
    );
}

export function WhoisCountryBubble({ country }: WhoisCountryBubbleProps) {
    return (
        <div className={`${classes.bubble} ${classes.country}`}>
            <span className={classes.num}>{country.toUpperCase()}</span>
            <span className={classes.label}>Country</span>
        </div>
    );
}
