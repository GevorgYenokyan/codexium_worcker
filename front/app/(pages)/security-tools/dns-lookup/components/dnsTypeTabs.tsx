import classes from "../style/dnsTypeTabs.module.scss";

export type DnsRecordType =
    | "A"
    | "AAAA"
    | "MX"
    | "CNAME"
    | "TXT"
    | "NS"
    | "SOA"
    | "PTR"
    | "SRV"
    | "CAA";

export const ALL_TYPES: DnsRecordType[] = [
    "A",
    "AAAA",
    "MX",
    "CNAME",
    "TXT",
    "NS",
    "SOA",
    "PTR",
    "SRV",
    "CAA",
];

export const TYPE_COLORS: Record<DnsRecordType, string> = {
    A: "#4bb749",
    AAAA: "#2196f3",
    MX: "#ff9800",
    CNAME: "#9c27b0",
    TXT: "#00bcd4",
    NS: "#e91e63",
    SOA: "#607d8b",
    PTR: "#ff5722",
    SRV: "#795548",
    CAA: "#ffc107",
};

interface TypeSummary {
    type: DnsRecordType;
    found: boolean;
    propagated: boolean;
}

interface DnsTypeTabsProps {
    activeType: DnsRecordType | "ALL";
    typeSummaries: TypeSummary[];
    onChange: (type: DnsRecordType | "ALL") => void;
}

export function DnsTypeTabs({ activeType, typeSummaries, onChange }: DnsTypeTabsProps) {
    return (
        <div className={classes.tabs}>
            <button
                className={`${classes.tab} ${activeType === "ALL" ? classes.tabActive : ""}`}
                onClick={() => onChange("ALL")}
            >
                All
            </button>

            {ALL_TYPES.map((t) => {
                const summary = typeSummaries.find((s) => s.type === t);
                const found = summary?.found;
                return (
                    <button
                        key={t}
                        className={`${classes.tab} ${activeType === t ? classes.tabActive : ""} ${!found ? classes.tabEmpty : ""}`}
                        style={
                            activeType === t && found
                                ? { borderBottomColor: TYPE_COLORS[t], color: TYPE_COLORS[t] }
                                : {}
                        }
                        onClick={() => onChange(t)}
                    >
                        {t}
                        {found && (
                            <span
                                className={`${classes.dot} ${summary?.propagated ? classes.dotGreen : classes.dotYellow}`}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
