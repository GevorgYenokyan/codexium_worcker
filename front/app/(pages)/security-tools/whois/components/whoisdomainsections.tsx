import classes from "../style/whoisDomainSections.module.scss";
import { CollapsibleSection } from "@/app/shared/ui/cybersecurityTools/collapsibleSection/collapsibleSection";
import { InfoRow, InfoGrid } from "@/app/shared/ui/cybersecurityTools/infoGrid/infoGrid";
import { MonoBadgeList } from "@/app/shared/ui/cybersecurityTools/monoBadge/monobadge";

// ─── Types ────────────────────────────────────────────────────────────────────
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
    isExpired: boolean;
    isExpiringSoon: boolean;
}

interface WhoisDomainSectionsProps {
    domainName: string | null;
    tld: string | null;
    country: string | null;
    organization: string | null;
    dnssec: string | null;
    registrar: WhoisRegistrar;
    dates: WhoisDates;
    nameservers: string[];
    status: WhoisStatus;
    registrant: WhoisContact | null;
    admin: WhoisContact | null;
    tech: WhoisContact | null;
    expanded: Set<string>;
    onToggle: (key: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

// ─── Component ────────────────────────────────────────────────────────────────
export function WhoisDomainSections({
    domainName,
    tld,
    country,
    organization,
    dnssec,
    registrar,
    dates,
    nameservers,
    status,
    registrant,
    admin,
    tech,
    expanded,
    onToggle,
}: WhoisDomainSectionsProps) {
    const expiryValue = dates.expires
        ? `${fmtDate(dates.expires)}${
              dates.daysUntilExpiry !== null
                  ? ` (${dates.daysUntilExpiry < 0 ? "expired" : dates.daysUntilExpiry + " days left"})`
                  : ""
          }`
        : null;

    const expiryHighlight =
        dates.daysUntilExpiry !== null
            ? dates.daysUntilExpiry < 0
                ? "fail"
                : dates.daysUntilExpiry <= 30
                  ? "warn"
                  : undefined
            : undefined;

    const contacts = [
        { label: "Registrant", contact: registrant },
        { label: "Admin Contact", contact: admin },
        { label: "Technical Contact", contact: tech },
    ].filter((c) => c.contact);

    return (
        <>
            <CollapsibleSection
                title="Overview"
                sectionKey="overview"
                expanded={expanded}
                onToggle={onToggle}
            >
                <InfoGrid cols={2}>
                    <InfoRow label="Domain" value={domainName} />
                    <InfoRow label="TLD" value={tld?.toUpperCase()} />
                    <InfoRow label="Registrar" value={registrar.name} />
                    <InfoRow
                        label="Registrar URL"
                        value={registrar.url}
                        link={registrar.url ?? undefined}
                    />
                    <InfoRow label="DNSSEC" value={dnssec} />
                    <InfoRow label="Country" value={country} />
                    {organization && <InfoRow label="Organization" value={organization} />}
                </InfoGrid>
            </CollapsibleSection>

            <CollapsibleSection
                title="Important Dates"
                sectionKey="dates"
                expanded={expanded}
                onToggle={onToggle}
            >
                <InfoGrid cols={2}>
                    <InfoRow label="Created" value={fmtDate(dates.created)} />
                    <InfoRow label="Updated" value={fmtDate(dates.updated)} />
                    <InfoRow
                        label="Expires"
                        value={expiryValue}
                        highlight={expiryHighlight as any}
                    />
                </InfoGrid>
            </CollapsibleSection>

            {nameservers.length > 0 && (
                <CollapsibleSection
                    title={`Nameservers (${nameservers.length})`}
                    sectionKey="nameservers"
                    expanded={expanded}
                    onToggle={onToggle}
                >
                    <MonoBadgeList items={nameservers} variant="green" />
                </CollapsibleSection>
            )}

            {status.codes.length > 0 && (
                <CollapsibleSection
                    title="Domain Status"
                    sectionKey="status"
                    expanded={expanded}
                    onToggle={onToggle}
                >
                    {(status.isExpired || status.isExpiringSoon) && (
                        <div className={classes.statusAlert}>
                            {status.isExpired
                                ? "⚠ This domain has expired"
                                : `⚠ This domain expires in ${dates.daysUntilExpiry} days`}
                        </div>
                    )}
                    <div className={classes.statusList}>
                        {status.codes.map((code) => (
                            <div key={code} className={classes.statusItem}>
                                <span className={classes.statusDot} />
                                <span className={classes.statusCode}>{code}</span>
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>
            )}

            {contacts.map(({ label, contact }) => (
                <CollapsibleSection
                    key={label}
                    title={label}
                    sectionKey={label}
                    expanded={expanded}
                    onToggle={onToggle}
                >
                    <InfoGrid cols={2}>
                        <InfoRow label="Name" value={contact!.name} />
                        <InfoRow label="Organization" value={contact!.organization} />
                        <InfoRow label="Email" value={contact!.email} />
                        <InfoRow label="Phone" value={contact!.phone} />
                        <InfoRow label="Country" value={contact!.country} />
                        <InfoRow label="City" value={contact!.city} />
                    </InfoGrid>
                </CollapsibleSection>
            ))}

            {(registrar.abuseEmail || registrar.abusePhone) && (
                <CollapsibleSection
                    title="Registrar Abuse Contact"
                    sectionKey="abuse"
                    expanded={expanded}
                    onToggle={onToggle}
                >
                    <InfoGrid cols={2}>
                        <InfoRow label="Abuse Email" value={registrar.abuseEmail} />
                        <InfoRow label="Abuse Phone" value={registrar.abusePhone} />
                    </InfoGrid>
                </CollapsibleSection>
            )}
        </>
    );
}
