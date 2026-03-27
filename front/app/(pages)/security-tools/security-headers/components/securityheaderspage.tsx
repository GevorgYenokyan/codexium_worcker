"use client";

import classes from "../style/securityheaderspage.module.scss";
import { useEffect, useState } from "react";
import { PageLayout } from "@/app/shared/ui/cybersecurityTools/pageLayout/pageLayout";
import { ScanSearchBar } from "@/app/shared/ui/cybersecurityTools/scanSearchBar/scanSearchBar";
import { ErrorBox } from "@/app/shared/ui/cybersecurityTools/errorBox/errorBox";
import { GradeCard, Grade } from "@/app/shared/ui/cybersecurityTools/gradeCard/gradeCard";
import { StatusDot, StatusBadge } from "@/app/shared/ui/cybersecurityTools/status/status";

import { useSecurityHeadersMutation } from "@/app/redux/features/api/codexiumApi";

import {
    validateHeadersUrl,
    normalizeUrl,
} from "@/app/shared/ui/cybersecurityTools/urlValidator/urlValidator";
import useQueryParams from "@/app/hooks/useQueryParams";
import { useSearchParams } from "next/navigation";
import { useAutoScan } from "@/app/hooks/useautoscan";

// ─── Types ────────────────────────────────────────────────────────────────────
type HeaderStatus = "present" | "missing" | "warning";

interface HeaderResult {
    name: string;
    status: HeaderStatus;
    value?: string;
    description: string;
    recommendation?: string;
    weight: "critical" | "important" | "medium";
    learnMore?: string;
}

interface HeadersScanResult {
    url: string;
    grade: Grade;
    score: number;
    scannedAt: string;
    headers: HeaderResult[];
    rawHeaders: Record<string, string>;
    summary: { passed: number; failed: number; warnings: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const gradeDescription: Record<Grade, string> = {
    "A+": "Excellent security headers",
    A: "Good headers configuration",
    B: "Adequate — some improvements recommended",
    C: "Weak configuration — action needed",
    D: "Poor configuration — take action",
    F: "Failed — critical headers missing",
    T: "Not trusted",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function HeadersCheck() {
    const params = useSearchParams();

    const [inputValue, setInputValue] = useState(() => normalizeUrl(params.get("url") ?? ""));
    const [validationError, setValidationError] = useState<string | null>(null);
    const [expandedHeaders, setExpandedHeaders] = useState<Set<string>>(new Set());

    const [scan, { isLoading, isError, data, error }] = useSecurityHeadersMutation();
    const { updateQueryParam } = useQueryParams();

    const result = data as HeadersScanResult | undefined;

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleChange = (value: string) => {
        setInputValue(value);
        if (validationError) setValidationError(null);
    };

    const handleBlur = () => {
        const normalised = normalizeUrl(inputValue);
        if (normalised !== inputValue) setInputValue(normalised);
    };

    const handleScan = (override?: string) => {
        const normalised = normalizeUrl(override ?? inputValue);
        setInputValue(normalised);

        const { valid, error: urlError } = validateHeadersUrl(normalised);
        if (!valid) {
            setValidationError(urlError ?? "Invalid URL");
            return;
        }

        setValidationError(null);
        scan({ url: normalised });
        updateQueryParam("url", normalised);
    };

    // Auto-scan when ?url= is present in the query string
    useAutoScan({ onScan: handleScan, paramName: "url" });

    const toggleHeader = (name: string) =>
        setExpandedHeaders((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });

    const errorMessage =
        validationError ??
        (isError && error ? ((error as any)?.data?.message ?? "Scan failed") : null);

    return (
        <PageLayout
            title="HTTP Security Headers Checker"
            subtitle="Analyse your site's security headers and get actionable recommendations — no login required"
        >
            <ScanSearchBar
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onScan={() => handleScan()}
                isLoading={isLoading}
                placeholder="example.com"
            />

            {errorMessage && <ErrorBox message={errorMessage} />}

            {result && (
                <div className={classes.results}>
                    <GradeCard
                        grade={result.grade}
                        host={result.url}
                        description={gradeDescription[result.grade]}
                        meta={`Score: ${result.score}/100 · Scanned ${new Date(result.scannedAt).toLocaleTimeString()}`}
                        summary={result.summary}
                    />

                    <div className={classes.headersList}>
                        {result.headers.map((header) => (
                            <div key={header.name} className={classes.headerItem}>
                                <button
                                    className={classes.headerRow}
                                    onClick={() => toggleHeader(header.name)}
                                >
                                    <StatusDot status={header.status} />
                                    <span className={classes.headerName}>{header.name}</span>
                                    <span className={classes.headerWeight}>{header.weight}</span>
                                    <StatusBadge status={header.status} />
                                    <span className={classes.chevron}>
                                        {expandedHeaders.has(header.name) ? "▲" : "▼"}
                                    </span>
                                </button>

                                {expandedHeaders.has(header.name) && (
                                    <div className={classes.headerDetails}>
                                        {header.value && (
                                            <div className={classes.headerValue}>
                                                {header.value}
                                            </div>
                                        )}
                                        <p className={classes.headerDescription}>
                                            {header.description}
                                        </p>
                                        {header.recommendation && (
                                            <p className={classes.headerRecommendation}>
                                                <span>Recommendation: </span>
                                                {header.recommendation}
                                            </p>
                                        )}
                                        {header.learnMore && (
                                            <a
                                                href={header.learnMore}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={classes.learnMore}
                                            >
                                                Learn more →
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {result.rawHeaders && (
                        <details className={classes.rawHeaders}>
                            <summary className={classes.rawHeadersSummary}>
                                Show raw response headers
                            </summary>
                            <div className={classes.rawHeadersList}>
                                {Object.entries(result.rawHeaders).map(([key, val]) => (
                                    <div key={key} className={classes.rawHeaderRow}>
                                        <span className={classes.rawHeaderKey}>{key}</span>
                                        <span className={classes.rawHeaderSep}>: </span>
                                        <span className={classes.rawHeaderVal}>{val}</span>
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}
                </div>
            )}
        </PageLayout>
    );
}
