"use client";

import classes from "../style/whoispage.module.scss";
import { useState } from "react";
import { useWhoisLookupMutation } from "@/app/redux/features/api/codexiumApi";

import { PageLayout } from "@/app/shared/ui/cybersecurityTools/pageLayout/pageLayout";
import { ScanSearchBar } from "@/app/shared/ui/cybersecurityTools/scanSearchBar/scanSearchBar";
import { ErrorBox } from "@/app/shared/ui/cybersecurityTools/errorBox/errorBox";

import { WhoisHero } from "./whoisHero";
import { WhoisDomainSections } from "./whoisdomainsections";
import { WhoisIpSection } from "./whoisipsection";
import { WhoisRawOutput } from "./whoisrawoutput";
import { useAutoScan } from "@/app/hooks/useautoscan";
import { useSearchParams } from "next/navigation";
import {
    normalizeWhoisQuery,
    validateWhoisQuery,
} from "@/app/shared/ui/cybersecurityTools/urlValidator/urlValidator";
import useQueryParams from "@/app/hooks/useQueryParams";

// ─── Types ────────────────────────────────────────────────────────────────────
type LookupType = "domain" | "ip";

interface WhoisRegistrar {
    name: string | null;
    url: string | null;
    abuseEmail: string | null;
    abusePhone: string | null;
}

interface WhoisDates {
    created: string | null;
    updated: string | null;
    expires: string | null;
    daysUntilExpiry: number | null;
}

interface WhoisContact {
    name: string | null;
    organization: string | null;
    email: string | null;
    phone: string | null;
    country: string | null;
    city: string | null;
}

interface WhoisStatus {
    codes: string[];
    isLocked: boolean;
    isExpired: boolean;
    isExpiringSoon: boolean;
}

interface WhoisResult {
    query: string;
    type: LookupType;
    tld: string | null;
    domainName: string | null;
    registrar: WhoisRegistrar;
    dates: WhoisDates;
    nameservers: { list: string[] };
    status: WhoisStatus;
    dnssec: string | null;
    ipRange: string | null;
    netName: string | null;
    country: string | null;
    asn: string | null;
    organization: string | null;
    isp: string | null;
    registrant: WhoisContact | null;
    admin: WhoisContact | null;
    tech: WhoisContact | null;
    raw: string;
    scannedAt: string;
}

// ─── Default open sections ────────────────────────────────────────────────────
const DEFAULT_OPEN = new Set(["overview", "dates", "nameservers", "status"]);

// ─── Component ────────────────────────────────────────────────────────────────
export default function WhoisPage() {
    const params = useSearchParams();

    const [query, setQuery] = useState(() => normalizeWhoisQuery(params.get("query") ?? ""));
    const [validationError, setValidationError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set(DEFAULT_OPEN));
    const [lookup, { isLoading, isError, data, error }] = useWhoisLookupMutation();
    const { updateQueryParam } = useQueryParams();
    const result = data as WhoisResult | undefined;

    const toggle = (key: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });

    const handleChange = (value: string) => {
        setQuery(value);
        if (validationError) setValidationError(null);
    };

    const handleBlur = () => {
        const cleaned = normalizeWhoisQuery(query);
        if (cleaned !== query) setQuery(cleaned);
    };

    const handleLookup = (override?: string) => {
        const normalizedQuery = normalizeWhoisQuery(override ?? query);
        setQuery(normalizedQuery);

        const { valid, error: queryError } = validateWhoisQuery(normalizedQuery);
        if (!valid) {
            setValidationError(queryError ?? "Invalid domain or IP");
            return;
        }
        setValidationError(null);
        setExpanded(new Set(DEFAULT_OPEN));
        lookup({ query: normalizedQuery });
        updateQueryParam("query", normalizedQuery);
    };

    useAutoScan({ onScan: handleLookup, paramName: "query" });

    const errorMessage =
        validationError ??
        (isError && error ? ((error as any)?.data?.message ?? "Lookup failed") : null);

    return (
        <PageLayout
            title="WHOIS Lookup"
            subtitle="Domain registration info, IP ownership, nameservers and more"
        >
            <ScanSearchBar
                value={query}
                onChange={handleChange}
                onBlur={handleBlur}
                onScan={handleLookup}
                isLoading={isLoading}
                placeholder="example.com or 8.8.8.8"
                scanLabel="Lookup"
            />

            {errorMessage && <ErrorBox message={errorMessage} />}

            {result && (
                <div className={classes.results}>
                    <WhoisHero
                        type={result.type}
                        query={result.query}
                        domainName={result.domainName}
                        registrarName={result.registrar.name}
                        organization={result.organization}
                        daysUntilExpiry={result.dates.daysUntilExpiry}
                        country={result.country}
                    />

                    {result.type === "domain" && (
                        <WhoisDomainSections
                            domainName={result.domainName}
                            tld={result.tld}
                            country={result.country}
                            organization={result.organization}
                            dnssec={result.dnssec}
                            registrar={result.registrar}
                            dates={result.dates}
                            nameservers={result.nameservers.list}
                            status={result.status}
                            registrant={result.registrant}
                            admin={result.admin}
                            tech={result.tech}
                            expanded={expanded}
                            onToggle={toggle}
                        />
                    )}

                    {result.type === "ip" && (
                        <WhoisIpSection
                            query={result.query}
                            ipRange={result.ipRange}
                            netName={result.netName}
                            organization={result.organization}
                            isp={result.isp}
                            asn={result.asn}
                            country={result.country}
                            abuseEmail={result.registrar.abuseEmail}
                            abusePhone={result.registrar.abusePhone}
                            expanded={expanded}
                            onToggle={toggle}
                        />
                    )}

                    <WhoisRawOutput raw={result.raw} />
                </div>
            )}
        </PageLayout>
    );
}
