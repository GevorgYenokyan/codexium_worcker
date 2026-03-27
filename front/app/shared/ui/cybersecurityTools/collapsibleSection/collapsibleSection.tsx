"use client";

import { ReactNode } from "react";
import classes from "./collapsibleSection.module.scss";

interface CollapsibleSectionProps {
    title: string;
    sectionKey: string;
    expanded: Set<string>;
    onToggle: (key: string) => void;
    children: ReactNode;
    /** Если false — заголовок не кликабелен (например, Security Checks) */
    collapsible?: boolean;
}

export function CollapsibleSection({
    title,
    sectionKey,
    expanded,
    onToggle,
    children,
    collapsible = true,
}: CollapsibleSectionProps) {
    const isOpen = !collapsible || expanded.has(sectionKey);

    return (
        <div className={classes.section}>
            {collapsible ? (
                <button className={classes.sectionHeader} onClick={() => onToggle(sectionKey)}>
                    <span>{title}</span>
                    <span className={classes.chevron}>{isOpen ? "▲" : "▼"}</span>
                </button>
            ) : (
                <div className={`${classes.sectionHeader} ${classes.sectionHeaderStatic}`}>
                    <span>{title}</span>
                </div>
            )}

            {isOpen && <div className={classes.sectionBody}>{children}</div>}
        </div>
    );
}
