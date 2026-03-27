import { TechCategory, CAT } from "./techDetectTypes";
import classes from "../style/techBanner.module.scss";

interface TechBannerProps {
    domain: string;
    total: number;
    foundCats: TechCategory[];
}

export function TechBanner({ domain, total, foundCats }: TechBannerProps) {
    return (
        <div className={classes.banner}>
            <div>
                <p className={classes.domain}>{domain}</p>
                <p className={classes.count}>
                    {total > 0 ? `${total} technologies detected` : "No technologies detected"}
                </p>
            </div>
            <div className={classes.cats}>
                {foundCats.map((cat) => (
                    <span
                        key={cat}
                        className={classes.catBadge}
                        style={{
                            color: CAT[cat]?.color,
                            borderColor: CAT[cat]?.color + "40",
                        }}
                    >
                        {CAT[cat]?.icon} {cat}
                    </span>
                ))}
            </div>
        </div>
    );
}
