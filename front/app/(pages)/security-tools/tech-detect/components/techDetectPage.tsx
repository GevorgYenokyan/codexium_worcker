"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTechDetectMutation } from "@/app/redux/features/api/codexiumApi";

import { PageLayout } from "@/app/shared/ui/cybersecurityTools/pageLayout/pageLayout";
import { ScanSearchBar } from "@/app/shared/ui/cybersecurityTools/scanSearchBar/scanSearchBar";
import { ErrorBox } from "@/app/shared/ui/cybersecurityTools/errorBox/errorBox";
import {
    validateHeadersUrl,
    normalizeUrl,
} from "@/app/shared/ui/cybersecurityTools/urlValidator/urlValidator";
import { useAutoScan } from "@/app/hooks/useautoscan";
import useQueryParams from "@/app/hooks/useQueryParams";

import { TechBanner } from "./techBanner";
import { TechCategoryTabs } from "./techCategoryTabs";
import { TechGrid } from "./techGrid";
import { TechRawHeaders } from "./techRawHeaders";
import { TechCategory, TechDetectionResult } from "./techDetectTypes";

import classes from "../style/techdetectpage.module.scss";

// ─── Component ────────────────────────────────────────────────────────────────
export default function TechDetectPage() {
    const params = useSearchParams();
    const { updateQueryParam } = useQueryParams();

    const [inputValue, setInputValue] = useState(() => normalizeUrl(params.get("url") ?? ""));
    const [validationError, setValidationError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TechCategory | "all">("all");

    const [detect, { isLoading, isError, data, error }] = useTechDetectMutation();
    const result = data as TechDetectionResult | undefined;

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleChange = (value: string) => {
        setInputValue(value);
        if (validationError) setValidationError(null);
    };

    const handleBlur = () => {
        const normalised = normalizeUrl(inputValue);
        if (normalised !== inputValue) setInputValue(normalised);
    };

    const handleDetect = (override?: string) => {
        const normalised = normalizeUrl(override ?? inputValue);
        setInputValue(normalised);

        const { valid, error: urlError } = validateHeadersUrl(normalised);
        if (!valid) {
            setValidationError(urlError ?? "Invalid URL");
            return;
        }

        setValidationError(null);
        setActiveTab("all");
        detect({ url: normalised });
        updateQueryParam("url", normalised);
    };

    useAutoScan({ onScan: handleDetect, paramName: "url" });

    const foundCats = result ? (Object.keys(result.summary.byCategory) as TechCategory[]) : [];

    const displayed = !result
        ? []
        : activeTab === "all"
          ? result.technologies
          : (result.byCategory[activeTab] ?? []);

    const errorMessage =
        validationError ??
        (isError && error ? ((error as any)?.data?.message ?? "Detection failed") : null);

    return (
        <PageLayout
            title="Technology Detector"
            subtitle="Find out what technologies power any website — no login required"
        >
            <ScanSearchBar
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onScan={() => handleDetect()}
                isLoading={isLoading}
                placeholder="example.com or https://example.com"
                scanLabel="Detect"
            />

            {errorMessage && <ErrorBox message={errorMessage} />}

            {isLoading && (
                <div className={classes.loadingBox}>
                    <div className={classes.spinner} />
                    <p>Analysing headers, cookies and HTML body…</p>
                </div>
            )}

            {result && !isLoading && (
                <div className={classes.results}>
                    <TechBanner
                        domain={result.domain}
                        total={result.summary.total}
                        foundCats={foundCats}
                    />

                    {result.cdnBlocking && result.cdnNote && (
                        <div className={classes.cdnWarning}>⚠ {result.cdnNote}</div>
                    )}

                    {result.summary.total > 0 && (
                        <>
                            <TechCategoryTabs
                                activeTab={activeTab}
                                foundCats={foundCats}
                                total={result.summary.total}
                                byCategory={result.summary.byCategory}
                                onChange={setActiveTab}
                            />
                            <TechGrid technologies={displayed} />
                        </>
                    )}

                    <TechRawHeaders rawHeaders={result.rawHeaders} />
                </div>
            )}
        </PageLayout>
    );
}
