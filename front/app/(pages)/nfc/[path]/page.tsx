import NfcCard from "./components/nfcCard";

export default function Nfc({ params }: { params: { path: string } }) {
    return (
        <div>
            <NfcCard path={params.path} />
        </div>
    );
}
