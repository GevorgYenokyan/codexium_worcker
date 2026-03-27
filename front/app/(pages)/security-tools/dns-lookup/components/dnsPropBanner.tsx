import classes from "../style/dnsPropBanner.module.scss";
import { DnsRecordType } from "./dnsTypeTabs";

interface TypeSummary {
    type: DnsRecordType;
    found: boolean;
    propagated: boolean;
    consistency: number;
    uniqueAnswers: number;
}

interface DnsPropBannerProps {
    activeType: DnsRecordType;
    summary: TypeSummary;
}

export function DnsPropBanner({ activeType, summary }: DnsPropBannerProps) {
    const bannerClass = !summary.found
        ? classes.none
        : summary.propagated
          ? classes.ok
          : classes.partial;

    const text = !summary.found
        ? `No ${activeType} records found`
        : summary.propagated
          ? `✓ ${activeType} fully propagated (${summary.consistency}% consistent)`
          : `◑ ${activeType} partially propagated — ${summary.consistency}% consistent, ${summary.uniqueAnswers} different answer(s)`;

    return <div className={`${classes.banner} ${bannerClass}`}>{text}</div>;
}
