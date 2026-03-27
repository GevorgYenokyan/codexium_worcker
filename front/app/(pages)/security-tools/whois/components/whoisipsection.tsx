import { CollapsibleSection } from "@/app/shared/ui/cybersecurityTools/collapsibleSection/collapsibleSection";
import { InfoRow, InfoGrid } from "@/app/shared/ui/cybersecurityTools/infoGrid/infoGrid";

interface WhoisIpSectionProps {
    query: string;
    ipRange: string | null;
    netName: string | null;
    organization: string | null;
    isp: string | null;
    asn: string | null;
    country: string | null;
    abuseEmail: string | null;
    abusePhone: string | null;
    expanded: Set<string>;
    onToggle: (key: string) => void;
}

export function WhoisIpSection({
    query,
    ipRange,
    netName,
    organization,
    isp,
    asn,
    country,
    abuseEmail,
    abusePhone,
    expanded,
    onToggle,
}: WhoisIpSectionProps) {
    return (
        <CollapsibleSection
            title="IP Information"
            sectionKey="overview"
            expanded={expanded}
            onToggle={onToggle}
        >
            <InfoGrid cols={2}>
                <InfoRow label="IP Address" value={query} />
                <InfoRow label="IP Range" value={ipRange} />
                <InfoRow label="Network Name" value={netName} />
                <InfoRow label="Organization" value={organization} />
                <InfoRow label="ISP" value={isp} />
                <InfoRow label="ASN" value={asn} />
                <InfoRow label="Country" value={country} />
                <InfoRow label="Abuse Email" value={abuseEmail} />
                <InfoRow label="Abuse Phone" value={abusePhone} />
            </InfoGrid>
        </CollapsibleSection>
    );
}
