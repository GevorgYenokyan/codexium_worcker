"use client";

import classes from "../style/whoisRawOutput.module.scss";
import { useState } from "react";

interface WhoisRawOutputProps {
    raw: string;
}

export function WhoisRawOutput({ raw }: WhoisRawOutputProps) {
    const [showRaw, setShowRaw] = useState(false);

    return (
        <div className={classes.rawSection}>
            {/* <button className={classes.rawToggle} onClick={() => setShowRaw((p) => !p)}>
                {showRaw ? "Hide" : "Show"} raw WHOIS output
            </button> */}
            <pre className={classes.rawPre}>{raw}</pre>
        </div>
    );
}
