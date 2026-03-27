"use client";

import classes from "../style/dnslookuppage.module.scss";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDnsLookupMutation } from "@/app/redux/features/api/codexiumApi";

import { PageLayout } from "@/app/shared/ui/cybersecurityTools/pageLayout/pageLayout";
import { ScanSearchBar } from "@/app/shared/ui/cybersecurityTools/scanSearchBar/scanSearchBar";
import { ErrorBox } from "@/app/shared/ui/cybersecurityTools/errorBox/errorBox";
import {
    validateWhoisQuery,
    normalizeWhoisQuery,
} from "@/app/shared/ui/cybersecurityTools/urlValidator/urlValidator";
import { useAutoScan } from "@/app/hooks/useautoscan";
import useQueryParams from "@/app/hooks/useQueryParams";

import { DnsSummaryRow } from "./dnsSummaryRow";
import { DnsTypeTabs, DnsRecordType, ALL_TYPES } from "./dnsTypeTabs";
import { DnsPropBanner } from "./dnsPropBanner";
import { DnsAnswerSets } from "./dnsAnswerSets";
import { DnsTable } from "./dnsTable";

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface ServerResult {
    ip: string;
    location: string;
    status: "ok" | "error" | "timeout";
    responseTimeMs: number;
    answerId: string | null;
}

interface TypeSummary {
    type: DnsRecordType;
    found: boolean;
    propagated: boolean;
    consistency: number;
    uniqueAnswers: number;
}

interface DnsLookupResult {
    query: string;
    scannedAt: string;
    propagated: boolean;
    typeSummaries: TypeSummary[];
    answerSets: AnswerSet[];
    servers: ServerResult[];
    summary: {
        total: number;
        ok: number;
        errors: number;
        typesFound: DnsRecordType[];
        uniqueAnswerSets: number;
    };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DnsLookupPage() {
    const params = useSearchParams();
    const { updateQueryParam } = useQueryParams();

    const [query, setQuery] = useState(() => normalizeWhoisQuery(params.get("query") ?? ""));
    const [validationError, setValidationError] = useState<string | null>(null);
    const [activeType, setActiveType] = useState<DnsRecordType | "ALL">("ALL");
    const [filter, setFilter] = useState("");

    const [lookup, { isLoading, isError, data, error }] = useDnsLookupMutation();
    const result = data as DnsLookupResult | undefined;

    // O(1) answerId → AnswerSet lookup
    const answerMap = new Map<string, AnswerSet>();
    result?.answerSets.forEach((a) => answerMap.set(a.id, a));

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleChange = (value: string) => {
        setQuery(value);
        if (validationError) setValidationError(null);
    };

    const handleBlur = () => {
        const cleaned = normalizeWhoisQuery(query);
        if (cleaned !== query) setQuery(cleaned);
    };

    const handleLookup = (override?: string) => {
        const normalized = normalizeWhoisQuery(override ?? query);
        setQuery(normalized);

        const { valid, error: queryError } = validateWhoisQuery(normalized);
        if (!valid) {
            setValidationError(queryError ?? "Invalid domain or IP");
            return;
        }

        setValidationError(null);
        setActiveType("ALL");
        setFilter("");
        lookup({ query: normalized });
        updateQueryParam("query", normalized);
    };

    useAutoScan({ onScan: handleLookup, paramName: "query" });

    const activeSummary = result?.typeSummaries.find((t) => t.type === activeType);

    const errorMessage =
        validationError ??
        (isError && error ? ((error as any)?.data?.message ?? "Lookup failed") : null);

    return (
        <PageLayout
            title="DNS Lookup"
            subtitle="All record types · 18 global nameservers · one request"
        >
            <ScanSearchBar
                value={query}
                onChange={handleChange}
                onBlur={handleBlur}
                onScan={() => handleLookup()}
                isLoading={isLoading}
                placeholder="example.com"
                scanLabel="Check DNS"
            />

            {errorMessage && <ErrorBox message={errorMessage} />}

            {isLoading && (
                <div className={classes.loadingBox}>
                    <div className={classes.spinner} />
                    <p>Querying 18 nameservers for all record types…</p>
                    <p className={classes.loadingHint}>{ALL_TYPES.join(", ")}</p>
                </div>
            )}

            {result && !isLoading && (
                <div className={classes.results}>
                    <DnsSummaryRow
                        ok={result.summary.ok}
                        total={result.summary.total}
                        typesFound={result.summary.typesFound.length}
                        uniqueAnswerSets={result.summary.uniqueAnswerSets}
                        propagated={result.propagated}
                    />

                    <DnsTypeTabs
                        activeType={activeType}
                        typeSummaries={result.typeSummaries}
                        onChange={setActiveType}
                    />

                    {activeType !== "ALL" && activeSummary && (
                        <DnsPropBanner activeType={activeType} summary={activeSummary} />
                    )}

                    <DnsAnswerSets answerSets={result.answerSets} activeType={activeType} />

                    <DnsTable
                        servers={result.servers}
                        answerMap={answerMap}
                        activeType={activeType}
                        filter={filter}
                        onFilterChange={setFilter}
                    />
                </div>
            )}
        </PageLayout>
    );
}
