import { DnsRecordType, TYPE_COLORS } from "./dnsTypeTabs";
import classes from "../style/dnsAnswerSets.module.scss";

interface DnsRecord {
    type: DnsRecordType;
    value: string;
    ttl: number | null;
    priority?: number;
}

interface AnswerSet {
    id: string;
    byType: Record<DnsRecordType, DnsRecord[]>;
    serversCount: number;
    isMainAnswer: boolean;
}

interface DnsAnswerSetsProps {
    answerSets: AnswerSet[];
    activeType: DnsRecordType | "ALL";
}

export function DnsAnswerSets({ answerSets, activeType }: DnsAnswerSetsProps) {
    if (answerSets.length <= 1) return null;

    return (
        <div className={classes.wrap}>
            <p className={classes.title}>⚠ {answerSets.length} different answers detected</p>

            {answerSets.map((set) => {
                const records =
                    activeType === "ALL"
                        ? Object.values(set.byType).flat()
                        : (set.byType[activeType] ?? []);

                return (
                    <div
                        key={set.id}
                        className={`${classes.row} ${set.isMainAnswer ? classes.rowMain : classes.rowOld}`}
                    >
                        <span className={classes.count}>{set.serversCount} server(s)</span>
                        <span className={classes.label}>
                            {set.isMainAnswer ? "New (main)" : "Old (propagating)"}
                        </span>
                        <div className={classes.records}>
                            {records.slice(0, 5).map((rec, i) => (
                                <span key={i} className={classes.value}>
                                    {activeType === "ALL" && (
                                        <b style={{ color: TYPE_COLORS[rec.type] }}>{rec.type} </b>
                                    )}
                                    {rec.value}
                                </span>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
