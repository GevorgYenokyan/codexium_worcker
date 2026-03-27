"use client";

import classes from "../style/emailsecuritypage.module.scss";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useEmailSecurityMutation } from "@/app/redux/features/api/codexiumApi";

import { PageLayout } from "@/app/shared/ui/cybersecurityTools/pageLayout/pageLayout";
import { ScanSearchBar } from "@/app/shared/ui/cybersecurityTools/scanSearchBar/scanSearchBar";
import { ErrorBox } from "@/app/shared/ui/cybersecurityTools/errorBox/errorBox";
import {
    validateWhoisQuery,
    normalizeWhoisQuery,
} from "@/app/shared/ui/cybersecurityTools/urlValidator/urlValidator";
import { useAutoScan } from "@/app/hooks/useautoscan";
import useQueryParams from "@/app/hooks/useQueryParams";

import { EmailGradeBanner } from "./emailGradeBanner";
import { EmailSpfCard } from "./emailSpfCard";
import { EmailDkimCard } from "./emailDkimCard";
import { EmailDmarcCard } from "./emailDmarcCard";
import { EmailMtaStsCard } from "./emailMtaStsCard";
import { EmailSecurityResult } from "./emailSecurityTypes";

// ─── Component ────────────────────────────────────────────────────────────────
export default function EmailSecurityPage() {
    const params = useSearchParams();
    const { updateQueryParam } = useQueryParams();

    const [domain, setDomain] = useState(() => normalizeWhoisQuery(params.get("domain") ?? ""));
    const [validationError, setValidationError] = useState<string | null>(null);

    const [check, { isLoading, isError, data, error }] = useEmailSecurityMutation();
    const result = data as EmailSecurityResult | undefined;

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleChange = (value: string) => {
        setDomain(value);
        if (validationError) setValidationError(null);
    };

    const handleBlur = () => {
        const cleaned = normalizeWhoisQuery(domain);
        if (cleaned !== domain) setDomain(cleaned);
    };

    const handleCheck = (override?: string) => {
        const normalized = normalizeWhoisQuery(override ?? domain);
        setDomain(normalized);

        const { valid, error: domainError } = validateWhoisQuery(normalized);
        if (!valid) {
            setValidationError(domainError ?? "Invalid domain");
            return;
        }

        setValidationError(null);
        check({ domain: normalized });
        updateQueryParam("domain", normalized);
    };

    useAutoScan({ onScan: handleCheck, paramName: "domain" });

    const errorMessage =
        validationError ??
        (isError && error ? ((error as any)?.data?.message ?? "Check failed") : null);

    return (
        <PageLayout
            title="Email Security Checker"
            subtitle="Check SPF, DKIM, DMARC and MTA-STS — no login required"
        >
            <ScanSearchBar
                value={domain}
                onChange={handleChange}
                onBlur={handleBlur}
                onScan={() => handleCheck()}
                isLoading={isLoading}
                placeholder="example.com"
                scanLabel="Check"
            />

            {errorMessage && <ErrorBox message={errorMessage} />}

            {isLoading && (
                <div className={classes.loadingBox}>
                    <div className={classes.spinner} />
                    <p>Checking DNS records…</p>
                </div>
            )}

            {result && !isLoading && (
                <div className={classes.results}>
                    <EmailGradeBanner
                        grade={result.grade}
                        domain={result.domain}
                        score={result.score}
                        summary={result.summary}
                    />
                    <EmailSpfCard spf={result.spf} />
                    <EmailDkimCard dkim={result.dkim} />
                    <EmailDmarcCard dmarc={result.dmarc} />
                    <EmailMtaStsCard mtaSts={result.mtaSts} />
                </div>
            )}
        </PageLayout>
    );
}
