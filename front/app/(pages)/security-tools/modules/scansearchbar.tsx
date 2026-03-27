"use client";

import { KeyboardEvent } from "react";
import { Input } from "@/app/shared/ui/inputs/input";
import classes from "./ScanSearchBar.module.scss";

interface ScanSearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onScan: () => void;
    isLoading: boolean;
    placeholder?: string;
    scanLabel?: string;
}

export function ScanSearchBar({
    value,
    onChange,
    onScan,
    isLoading,
    placeholder = "example.com",
    scanLabel = "Scan",
}: ScanSearchBarProps) {
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") onScan();
    };

    return (
        <div className={classes.searchBar}>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={classes.input}
            />
            <button
                onClick={onScan}
                disabled={isLoading || !value.trim()}
                className={classes.scanBtn}
            >
                {isLoading ? "Scanning…" : scanLabel}
            </button>
        </div>
    );
}
