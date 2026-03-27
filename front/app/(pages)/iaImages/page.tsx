"use client";

import { useState } from "react";
import Upscaler from "upscaler";
import classes from "./page.module.scss";
import model from "@upscalerjs/esrgan-thick/4x";

const upscaler = new Upscaler({ model: model });

export default function UpscaleUploader() {
    const [originalSrc, setOriginalSrc] = useState<string | null>(null);
    const [upscaledSrc, setUpscaledSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setUpscaledSrc(null);

        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result as string;
            setOriginalSrc(dataUrl);

            setLoading(true);
            try {
                const result = await upscaler.upscale(dataUrl, {
                    patchSize: 64,
                    padding: 5,
                    progress: undefined,
                });
                setUpscaledSrc(result);
            } catch (err) {
                setError("Upscaling failed.");
            } finally {
                setLoading(false);
            }
        };

        reader.readAsDataURL(file);
    };

    const handleDownload = () => {
        if (!upscaledSrc) return;

        const link = document.createElement("a");
        link.href = upscaledSrc;
        link.download = "codexium-image.png";
        link.click();
    };

    return (
        <div style={{ textAlign: "center" }} className={classes["container"]}>
            {/* <h2>Upload, Upscale & Download</h2>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {error && <p style={{ color: "red" }}>{error}</p>}

            {originalSrc && (
                <div style={{ marginTop: "20px" }}>
                    <h3>Original</h3>
                    <img src={originalSrc} alt="Original" style={{ maxWidth: "300px" }} />
                </div>
            )}

            {loading && <p>Upscaling… please wait</p>}

            {upscaledSrc && (
                <div style={{ marginTop: "20px" }}>
                    <h3>Upscaled</h3>
                    <img src={upscaledSrc} alt="Upscaled" style={{ maxWidth: "300px" }} />
                    <div style={{ marginTop: "10px" }}>
                        <button onClick={handleDownload}>Download Upscaled Image</button>
                    </div>
                </div>
            )} */}
        </div>
    );
}
