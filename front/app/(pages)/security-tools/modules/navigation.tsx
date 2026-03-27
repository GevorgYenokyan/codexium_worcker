"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CYBER_TOOLS } from "./cyberToolsRegistry";
import classes from "./navigation.module.scss";

export function ToolsNavigation() {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    if (pathname === "/security-tools") return null;

    const activeTool = CYBER_TOOLS.find((t) => t.href === pathname);

    return (
        <nav className={classes.nav} aria-label="Cybersecurity tools navigation">
            {/* ── Desktop tabs ── */}
            <div className={classes.track}>
                {CYBER_TOOLS.map((tool) => {
                    const isActive = pathname === tool.href;
                    return (
                        <Link
                            key={tool.href}
                            href={tool.href}
                            className={`${classes.tab} ${isActive ? classes.tabActive : ""}`}
                            aria-current={isActive ? "page" : undefined}
                        >
                            <span className={classes.dot} />
                            {tool.navLabel}
                        </Link>
                    );
                })}
            </div>

            {/* ── Mobile dropdown ── */}
            <div className={classes.mobile}>
                <button
                    className={classes.mobileToggle}
                    onClick={() => setMenuOpen((p) => !p)}
                    aria-expanded={menuOpen}
                >
                    <span className={classes.dot} />
                    <span>{activeTool?.navLabel ?? "Tools"}</span>
                    <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className={`${classes.chevron} ${menuOpen ? classes.chevronOpen : ""}`}
                    >
                        <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {menuOpen && (
                    <div className={classes.dropdown}>
                        {CYBER_TOOLS.map((tool) => {
                            const isActive = pathname === tool.href;
                            return (
                                <Link
                                    key={tool.href}
                                    href={tool.href}
                                    className={`${classes.dropdownItem} ${isActive ? classes.dropdownItemActive : ""}`}
                                    onClick={() => setMenuOpen(false)}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    <span className={classes.dot} />
                                    {tool.navLabel}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </nav>
    );
}
