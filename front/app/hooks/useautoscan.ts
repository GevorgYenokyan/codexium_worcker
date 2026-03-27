"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface UseAutoScanOptions {
    onScan: (value: string) => void;
    paramName?: string;
}

export function useAutoScan({ onScan, paramName = "url" }: UseAutoScanOptions): string | null {
    const params = useSearchParams();
    const paramValue = params.get(paramName);
    const firedRef = useRef(false);

    useEffect(() => {
        if (!paramValue || firedRef.current) return;
        firedRef.current = true;
        onScan(paramValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramValue]);

    // Returns the param value so pages can initialise useState lazily
    return paramValue;
}
