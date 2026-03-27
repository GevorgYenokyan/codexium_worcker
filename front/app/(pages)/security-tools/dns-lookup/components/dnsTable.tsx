import { DnsRecordType, TYPE_COLORS } from "./dnsTypeTabs";
import classes from "../style/dnsTable.module.scss";

interface DnsRecord {
    type: DnsRecordType;
    value: string;
    ttl: number | null;
    priority?: number;
}

interface AnswerSet {
    id: string;
    byType: Record<DnsRecordType, DnsRecord[]>;
}

interface ServerResult {
    ip: string;
    location: string;
    status: "ok" | "error" | "timeout";
    responseTimeMs: number;
    answerId: string | null;
}

interface DnsTableProps {
    servers: ServerResult[];
    answerMap: Map<string, AnswerSet>;
    activeType: DnsRecordType | "ALL";
    filter: string;
    onFilterChange: (value: string) => void;
}

// ─── Shared record renderer ───────────────────────────────────────────────────
function RecordRows({
    records,
    activeType,
}: {
    records: DnsRecord[];
    activeType: DnsRecordType | "ALL";
}) {
    if (records.length === 0) return <span className={classes.noRecord}>—</span>;
    return (
        <div className={classes.recordsList}>
            {records.map((rec, i) => (
                <div key={i} className={classes.recordRow}>
                    {activeType === "ALL" && (
                        <span
                            className={classes.recType}
                            style={{
                                color: TYPE_COLORS[rec.type],
                                borderColor: TYPE_COLORS[rec.type] + "40",
                            }}
                        >
                            {rec.type}
                        </span>
                    )}
                    {rec.priority != null && (
                        <span className={classes.priority}>{rec.priority}</span>
                    )}
                    <span className={classes.recValue}>{rec.value}</span>
                </div>
            ))}
        </div>
    );
}

function RtBadge({ ms }: { ms: number }) {
    return (
        <span className={ms < 100 ? classes.rtFast : ms < 500 ? classes.rtMed : classes.rtSlow}>
            {ms}ms
        </span>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DnsTable({
    servers,
    answerMap,
    activeType,
    filter,
    onFilterChange,
}: DnsTableProps) {
    const filtered = servers.filter(
        (s) =>
            !filter ||
            s.location.toLowerCase().includes(filter.toLowerCase()) ||
            s.ip.includes(filter),
    );

    const getRecords = (s: ServerResult): DnsRecord[] => {
        const answer = s.answerId ? answerMap.get(s.answerId) : null;
        if (!answer) return [];
        return activeType === "ALL"
            ? Object.values(answer.byType).flat()
            : (answer.byType[activeType] ?? []);
    };

    return (
        <>
            <input
                type="text"
                value={filter}
                onChange={(e) => onFilterChange(e.target.value)}
                placeholder="Filter by location or IP…"
                className={classes.filterInput}
            />

            {/* ── Desktop table — hidden below 576px ── */}
            <div className={classes.tableWrap}>
                <table className={classes.table}>
                    <thead>
                        <tr>
                            <th>Nameserver</th>
                            <th>Location</th>
                            <th>Records {activeType !== "ALL" ? `(${activeType})` : ""}</th>
                            <th>TTL</th>
                            <th>Response</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((s) => {
                            const records = getRecords(s);
                            return (
                                <tr key={s.ip} className={s.status !== "ok" ? classes.rowDim : ""}>
                                    <td className={classes.tdMono}>{s.ip}</td>
                                    <td>{s.location}</td>
                                    <td>
                                        {s.status !== "ok" ? (
                                            <span className={`${classes.badge} ${classes[`badge_${s.status}`]}`}>
                                                {s.status === "timeout" ? "⏱ Timeout" : "✗ Error"}
                                            </span>
                                        ) : (
                                            <RecordRows records={records} activeType={activeType} />
                                        )}
                                    </td>
                                    <td className={classes.tdTtl}>
                                        {records[0]?.ttl != null ? `${records[0].ttl}s` : "—"}
                                    </td>
                                    <td><RtBadge ms={s.responseTimeMs} /></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Mobile cards — shown below 576px ── */}
            <div className={classes.cardList}>
                {filtered.map((s) => {
                    const records = getRecords(s);
                    const isDim = s.status !== "ok";
                    return (
                        <div key={s.ip} className={`${classes.card} ${isDim ? classes.cardDim : ""}`}>
                            <div className={classes.cardHeader}>
                                <span className={classes.cardIp}>{s.ip}</span>
                                <RtBadge ms={s.responseTimeMs} />
                            </div>
                            <div className={classes.cardMeta}>
                                <span className={classes.cardLocation}>{s.location}</span>
                                {records[0]?.ttl != null && (
                                    <span className={classes.cardTtl}>TTL {records[0].ttl}s</span>
                                )}
                            </div>
                            <div className={classes.cardRecords}>
                                {s.status !== "ok" ? (
                                    <span className={`${classes.badge} ${classes[`badge_${s.status}`]}`}>
                                        {s.status === "timeout" ? "⏱ Timeout" : "✗ Error"}
                                    </span>
                                ) : (
                                    <RecordRows records={records} activeType={activeType} />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}