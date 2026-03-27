import classes from "../style/whoishero.module.scss";
import { WhoisExpiryBubble, WhoisCountryBubble } from "./whoisexpirybubble";

interface WhoisHeroProps {
    type: "domain" | "ip";
    query: string;
    domainName: string | null;
    registrarName: string | null;
    organization: string | null;
    daysUntilExpiry: number | null;
    country: string | null;
}

export function WhoisHero({
    type,
    query,
    domainName,
    registrarName,
    organization,
    daysUntilExpiry,
    country,
}: WhoisHeroProps) {
    return (
        <div className={`${classes.hero} ${type === "ip" ? classes.heroIp : classes.heroDomain}`}>
            <div className={classes.heroLeft}>
                <span className={classes.heroBadge}>
                    {type === "domain" ? "🌐 Domain" : "🖥 IP Address"}
                </span>
                <h2 className={classes.heroQuery}>{domainName ?? query}</h2>

                {registrarName && (
                    <p className={classes.heroMeta}>
                        Registrar: <span>{registrarName}</span>
                    </p>
                )}
                {organization && type === "ip" && (
                    <p className={classes.heroMeta}>
                        Organization: <span>{organization}</span>
                    </p>
                )}
            </div>

            <div className={classes.heroRight}>
                {type === "domain" && daysUntilExpiry !== null && (
                    <WhoisExpiryBubble daysUntilExpiry={daysUntilExpiry} />
                )}
                {type === "ip" && country && <WhoisCountryBubble country={country} />}
            </div>
        </div>
    );
}
