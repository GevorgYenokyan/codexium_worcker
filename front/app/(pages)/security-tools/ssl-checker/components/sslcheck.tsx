"use client";

import { useState } from "react";
import { useSslCheckMutation } from "@/app/redux/features/api/codexiumApi";

import { PageLayout } from "@/app/shared/ui/cybersecurityTools/pageLayout/pageLayout";
import { ScanSearchBar } from "@/app/shared/ui/cybersecurityTools/scanSearchBar/scanSearchBar";
import { ErrorBox } from "@/app/shared/ui/cybersecurityTools/errorBox/errorBox";
import { GradeCard } from "@/app/shared/ui/cybersecurityTools/gradeCard/gradeCard";
import { CollapsibleSection } from "@/app/shared/ui/cybersecurityTools/collapsibleSection/collapsibleSection";
import { StatusDot, StatusBadge } from "@/app/shared/ui/cybersecurityTools/status/status";
import {
    validateSslHost,
    normalizeSslHost,
} from "@/app/shared/ui/cybersecurityTools/urlValidator/urlValidator";
import classes from "../style/sslcheck.module.scss";
import { useAutoScan } from "@/app/hooks/useautoscan";
import { useSearchParams } from "next/navigation";
import useQueryParams from "@/app/hooks/useQueryParams";

// ─── Types ────────────────────────────────────────────────────────────────────
type SslGrade = "A+" | "A" | "B" | "C" | "D" | "F" | "T";
type CheckStatus = "pass" | "fail" | "warning" | "info";

interface CertificateInfo {
    subject: { CN: string; O?: string; C?: string };
    issuer: { CN: string; O?: string; C?: string };
    validFrom: string;
    validTo: string;
    daysRemaining: number;
    serialNumber: string;
    fingerprint256: string;
    subjectAltNames: string[];
    signatureAlgorithm: string;
    keyStrength: number | null;
}

interface ProtocolSupport {
    name: string;
    supported: boolean;
    secure: boolean;
}

interface CheckResult {
    name: string;
    status: CheckStatus;
    message: string;
    recommendation: string | null;
    weight: "critical" | "important" | "medium";
}

interface SslScanResult {
    host: string;
    port: number;
    grade: SslGrade;
    score: number;
    scannedAt: string;
    certificate: CertificateInfo;
    protocols: ProtocolSupport[];
    checks: CheckResult[];
    summary: { passed: number; failed: number; warnings: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const gradeDescription: Record<SslGrade, string> = {
    "A+": "Excellent configuration",
    A: "Good configuration",
    B: "Adequate — some improvements recommended",
    C: "Weak configuration — action needed",
    D: "Poor configuration — take action",
    F: "Failed — critical issues found",
    T: "Not trusted — certificate is invalid or self-signed",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SslCheck() {
    const params = useSearchParams();

    const [host, setHost] = useState(() => normalizeSslHost(params.get("host") ?? ""));
    const [validationError, setValidationError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [scan, { isLoading, isError, data, error }] = useSslCheckMutation();
    const { updateQueryParam } = useQueryParams();

    const result = data as SslScanResult | undefined;

    const toggle = (key: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });

    const handleChange = (value: string) => {
        setHost(value);
        if (validationError) setValidationError(null);
    };

    const handleBlur = () => {
        const cleaned = normalizeSslHost(host);
        if (cleaned !== host) setHost(cleaned);
    };

    const handleScan = (override?: string) => {
        const normalizedHost = normalizeSslHost(override ?? host);
        setHost(normalizedHost);

        const { valid, error: hostError } = validateSslHost(normalizedHost);
        if (!valid) {
            setValidationError(hostError ?? "Invalid hostname");
            return;
        }
        setValidationError(null);
        scan({ host: normalizedHost });
        updateQueryParam("host", normalizedHost);
    };

    useAutoScan({ onScan: handleScan, paramName: "host" });

    const errorMessage =
        validationError ??
        (isError && error ? ((error as any)?.data?.message ?? "Scan failed") : null);

    const cert = result?.certificate;

    return (
        <PageLayout
            title="SSL / TLS Certificate Checker"
            subtitle="Analyse certificate validity, key strength and supported TLS protocols — no login required"
        >
            <ScanSearchBar
                value={host}
                onChange={handleChange}
                onBlur={handleBlur}
                onScan={handleScan}
                isLoading={isLoading}
                placeholder="example.com"
            />

            {errorMessage && <ErrorBox message={errorMessage} />}

            {result && cert && (
                <div className={classes.results}>
                    {/* Grade card */}
                    <GradeCard
                        grade={result.grade}
                        host={result.host}
                        description={gradeDescription[result.grade]}
                        meta={`Score: ${result.score}/100 · Port ${result.port} · Scanned ${new Date(result.scannedAt).toLocaleTimeString()}`}
                        summary={result.summary}
                    />

                    {/* Certificate Details */}
                    <CollapsibleSection
                        title="Certificate Details"
                        sectionKey="cert"
                        expanded={expanded}
                        onToggle={toggle}
                    >
                        <div className={classes.certGrid}>
                            <CertRow label="Subject CN" value={cert.subject.CN} />
                            {cert.subject.O && (
                                <CertRow label="Organisation" value={cert.subject.O} />
                            )}
                            <CertRow label="Issuer" value={cert.issuer.CN} />
                            {cert.issuer.O && <CertRow label="Issuer Org" value={cert.issuer.O} />}
                            <CertRow
                                label="Valid From"
                                value={new Date(cert.validFrom).toLocaleDateString()}
                            />
                            <CertRow
                                label="Valid To"
                                value={`${new Date(cert.validTo).toLocaleDateString()} (${cert.daysRemaining} days)`}
                                highlight={
                                    cert.daysRemaining < 0
                                        ? "fail"
                                        : cert.daysRemaining < 30
                                          ? "warn"
                                          : undefined
                                }
                            />
                            {cert.keyStrength && (
                                <CertRow
                                    label="Key Strength"
                                    value={`${cert.keyStrength} bits`}
                                    highlight={cert.keyStrength < 2048 ? "fail" : undefined}
                                />
                            )}
                            <CertRow label="Signature Algorithm" value={cert.signatureAlgorithm} />
                            <CertRow label="Serial Number" value={cert.serialNumber} mono />
                            <CertRow label="SHA-256 Fingerprint" value={cert.fingerprint256} mono />
                        </div>

                        {cert.subjectAltNames.length > 0 && (
                            <div className={classes.sans}>
                                <p className={classes.sansLabel}>
                                    Subject Alternative Names ({cert.subjectAltNames.length})
                                </p>
                                <div className={classes.sansList}>
                                    {cert.subjectAltNames.map((san) => (
                                        <span key={san} className={classes.sansBadge}>
                                            {san}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CollapsibleSection>

                    {/* Protocol Support */}
                    <CollapsibleSection
                        title="Protocol Support"
                        sectionKey="protocols"
                        expanded={expanded}
                        onToggle={toggle}
                    >
                        {result.protocols.map((proto) => (
                            <div key={proto.name} className={classes.protoRow}>
                                <span className={classes.protoName}>{proto.name}</span>
                                <span
                                    className={`${classes.protoBadge} ${
                                        proto.supported
                                            ? proto.secure
                                                ? classes.protoBadgePass
                                                : classes.protoBadgeWarn
                                            : classes.protoBadgeOff
                                    }`}
                                >
                                    {proto.supported
                                        ? proto.secure
                                            ? "Supported ✓"
                                            : "Enabled ⚠"
                                        : "Not supported"}
                                </span>
                                {proto.supported && !proto.secure && (
                                    <span className={classes.protoHint}>
                                        Deprecated — disable this
                                    </span>
                                )}
                            </div>
                        ))}
                    </CollapsibleSection>

                    {/* Security Checks */}
                    <CollapsibleSection
                        title="Security Checks"
                        sectionKey="checks"
                        expanded={expanded}
                        onToggle={toggle}
                        collapsible={false}
                    >
                        {result.checks.map((check) => (
                            <div key={check.name} className={classes.checkRow}>
                                <StatusDot status={check.status} className={classes.checkDot} />
                                <div className={classes.checkContent}>
                                    <div className={classes.checkTop}>
                                        <span className={classes.checkName}>{check.name}</span>
                                        <StatusBadge status={check.status} />
                                    </div>
                                    <p className={classes.checkMessage}>{check.message}</p>
                                    {check.recommendation && (
                                        <p className={classes.checkRec}>
                                            <span>Fix: </span>
                                            {check.recommendation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CollapsibleSection>
                </div>
            )}
        </PageLayout>
    );
}

// ─── CertRow sub-component (локальный, специфичен для SSL) ────────────────────
function CertRow({
    label,
    value,
    mono = false,
    highlight,
}: {
    label: string;
    value: string;
    mono?: boolean;
    highlight?: "warn" | "fail";
}) {
    return (
        <div className={classes.certRow}>
            <span className={classes.certLabel}>{label}</span>
            <span
                className={`${classes.certValue} ${mono ? classes.certMono : ""} ${
                    highlight === "warn"
                        ? classes.certWarn
                        : highlight === "fail"
                          ? classes.certFail
                          : ""
                }`}
            >
                {value}
            </span>
        </div>
    );
}
