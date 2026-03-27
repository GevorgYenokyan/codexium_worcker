"use client";

import { FC, useState } from "react";
import classes from "../style/qrCode.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { Input } from "@/app/shared/ui/inputs/input";
import { ReactTyped } from "react-typed";

const QrCode: FC = () => {
    const [text, setText] = useState("");
    const lang = useAppSelector((state) => state.translation.leng);
    const [qrUrl, setQrUrl] = useState("");
    const [qrBlob, setQrBlob] = useState<Blob | null>(null);
    const [error, setError] = useState("");

    const handleGenerate = async () => {
        if (!text.trim()) {
            setError("Please enter text to generate a QR code");
            return;
        }
        setError("");
        const url = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
            text
        )}&size=200x200&format=png`;

        try {
            const response = await fetch(url, { method: "GET", mode: "cors" });
            if (!response.ok) throw new Error("Failed to fetch QR code");
            const blob = await response.blob();
            setQrBlob(blob);
            setQrUrl(URL.createObjectURL(blob));
        } catch (error) {}
    };

    const handleDownload = () => {
        if (!qrBlob) return;
        try {
            const url = URL.createObjectURL(qrBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "codexiumIt/qr.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
        }
    };

    const handleImageError = () => {
        setQrUrl("");
        setQrBlob(null);
    };

    return (
        <div className={classes.container}>
            <div className={classes.link_block}>
                <h2>
                    <span className={classes["line"]}></span>
                    <b>
                        <ReactTyped
                            strings={[`${translations[lang]["Qr"]}`]}
                            typeSpeed={40}
                            className={classes.line1}
                            showCursor={true}
                            startWhenVisible
                        />
                    </b>
                </h2>

                <div className={classes.qr_text}>
                    <h3>{translations[lang]["qr_title"]}</h3>
                    <p>{translations[lang]["qr_text"]}</p>
                </div>

                <div className={classes.qr_inputs}>
                    <label>{translations[lang]["Contact"]}</label>
                    <Input
                        type="text"
                        placeholder="https://codexium.it/?lang=arm"
                        value={text}
                        onChange={(e) => setText(e.target.value.slice(0, 1000))}
                        className={classes.qr_input}
                        aria-label="Text input for QR code generation"
                        maxLength={1000}
                    />
                </div>
                {error && <p className={classes.error}>{error}</p>}

                <button
                    onClick={handleGenerate}
                    className={classes.generate_btn}
                    disabled={!text.trim()}
                >
                    {translations[lang]["qr_btn"]}
                </button>
            </div>

            <div className={classes.qr_block}>
                <h4>{translations[lang]["QR Preview"]}</h4>
                <div className={classes.qr}>
                    {qrUrl && (
                        <img
                            src={qrUrl}
                            alt={`QR code for ${text}`}
                            width={200}
                            height={200}
                            className={classes.qrImage}
                            onError={handleImageError}
                        />
                    )}
                </div>

                {qrUrl && (
                    <button
                        onClick={handleDownload}
                        className={classes.download_btn}
                        disabled={!qrBlob}
                    >
                        {translations[lang]["Download QR"]}
                    </button>
                )}
            </div>
        </div>
    );
};

export default QrCode;
