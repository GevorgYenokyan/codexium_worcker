import classes from "./monoBadge.module.scss";

type MonoBadgeVariant = "green" | "blue" | "neutral";

interface MonoBadgeProps {
    label: string;
    variant?: MonoBadgeVariant;
}

export function MonoBadge({ label, variant = "green" }: MonoBadgeProps) {
    return <span className={`${classes.badge} ${classes[`badge_${variant}`]}`}>{label}</span>;
}

// ─── MonoBadgeList ────────────────────────────────────────────────────────────
interface MonoBadgeListProps {
    items: string[];
    variant?: MonoBadgeVariant;
}

export function MonoBadgeList({ items, variant = "green" }: MonoBadgeListProps) {
    return (
        <div className={classes.list}>
            {items.map((item) => (
                <MonoBadge key={item} label={item} variant={variant} />
            ))}
        </div>
    );
}
