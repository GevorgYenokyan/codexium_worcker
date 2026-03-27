"use client";

import { FC, useState, useCallback, ChangeEvent, useMemo } from "react";
import imageCompression from "browser-image-compression";
import classes from "../style/compressor.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { div } from "@tensorflow/tfjs";
import { ReactTyped } from "react-typed";

interface CompressionState {
    progress: number | null;
    inputSize: string | null;
    outputSize: string | null;
    inputUrl: string | null;
    outputUrl: string | null;
    error: string | null;
    fileName: string | null;
}

const ImageCompressor: FC = () => {
    const [maxSizeMB, setMaxSizeMB] = useState<number>(1);
    const [maxWidthOrHeight, setMaxWidthOrHeight] = useState<number>(1024);
    const lang = useAppSelector((state) => state.translation.leng);
    const [compressionState, setCompressionState] = useState<{
        webWorker: CompressionState;
        mainThread: CompressionState;
    }>({
        webWorker: {
            progress: null,
            inputSize: null,
            outputSize: null,
            inputUrl: null,
            outputUrl: null,
            error: null,
            fileName: null,
        },
        mainThread: {
            progress: null,
            inputSize: null,
            outputSize: null,
            inputUrl: null,
            outputUrl: null,
            error: null,
            fileName: null,
        },
    });

    const handleChange = useCallback(
        (target: "maxSizeMB" | "maxWidthOrHeight") => (e: ChangeEvent<HTMLInputElement>) => {
            const value = Number(e.target.value);
            if (target === "maxSizeMB") {
                setMaxSizeMB(Math.max(0.1, Math.min(value, 10)));
            } else {
                setMaxWidthOrHeight(Math.max(100, Math.min(value, 4000)));
            }
        },
        []
    );

    const resetState = useCallback((type: "webWorker" | "mainThread") => {
        setCompressionState((prev) => ({
            ...prev,
            [type]: {
                progress: null,
                inputSize: null,
                outputSize: null,
                inputUrl: null,
                outputUrl: null,
                error: null,
                fileName: null,
            },
        }));
    }, []);

    const compressImage = useCallback(
        async (event: ChangeEvent<HTMLInputElement> | any, useWebWorker: boolean) => {
            const file = event.target.files?.[0];
            if (!file) return;

            if (!file.type.startsWith("image/")) {
                setCompressionState((prev) => ({
                    ...prev,
                    [useWebWorker ? "webWorker" : "mainThread"]: {
                        ...prev[useWebWorker ? "webWorker" : "mainThread"],
                        error: "Please select an image file",
                    },
                }));
                return;
            }

            const targetName = useWebWorker ? "webWorker" : "mainThread";
            resetState(targetName);

            setCompressionState((prev) => ({
                ...prev,
                [targetName]: {
                    ...prev[targetName],
                    inputSize: (file.size / 1024 / 1024).toFixed(2),
                    inputUrl: URL.createObjectURL(file),
                    error: null,
                    fileName: file.name,
                },
            }));

            const options = {
                maxSizeMB,
                maxWidthOrHeight,
                useWebWorker,
                onProgress: (p: number) =>
                    setCompressionState((prev) => ({
                        ...prev,
                        [targetName]: { ...prev[targetName], progress: p },
                    })),
            };

            try {
                const output = await imageCompression(file, options);
                setCompressionState((prev) => ({
                    ...prev,
                    [targetName]: {
                        ...prev[targetName],
                        outputSize: (output.size / 1024 / 1024).toFixed(2),
                        outputUrl: URL.createObjectURL(output),
                        error: null,
                        fileName: `compressed_${file.name}`,
                    },
                }));
            } catch (error) {
                setCompressionState((prev) => ({
                    ...prev,
                    [targetName]: {
                        ...prev[targetName],
                        error:
                            "Compression failed: " +
                            (error instanceof Error ? error.message : "Unknown error"),
                    },
                }));
            }
        },
        [maxSizeMB, maxWidthOrHeight, resetState]
    );

    const handleDownload = useCallback(
        (type: "webWorker" | "mainThread") => {
            const state = compressionState[type];
            if (state.outputUrl && state.fileName) {
                const link = document.createElement("a");
                link.href = state.outputUrl;
                link.download = state.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        },
        [compressionState]
    );

    const isImageLoaded = useMemo(
        () => compressionState.webWorker.inputUrl || compressionState.mainThread.inputUrl,
        [compressionState]
    );

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        compressImage(event.dataTransfer.files, true);
    };

    return (
      <div className={classes.compressor}>
        <h2>
          <span className={classes["line"]}></span>
          <b>
            <ReactTyped
              strings={[`${translations[lang]["compress"]}`]}
              typeSpeed={40}
              className={classes.line1}
              showCursor={true}
              startWhenVisible
            />
          </b>
        </h2>

        <div className={classes.cards}>
          <div className={classes.card}>
            <img src="./compress/fast.png" alt="" />
            <h3>{translations[lang]["Fast Compression"]}</h3>
            <h4>{translations[lang]["Lightning"]}</h4>
          </div>
          <div className={classes.card}>
            <img src="./compress/privacy.png" alt="" />

            <h3>{translations[lang]["Privacy"]}</h3>
            <h4>{translations[lang]["local"]}</h4>
          </div>
          <div className={classes.card}>
            <img src="./compress/download.png" alt="" />

            <h3>{translations[lang]["Instant Download"]}</h3>
            <h4>{translations[lang]["get_your"]}</h4>
          </div>
        </div>
        {!isImageLoaded && (
          <div className={classes.compressionSections}>
            <h2 className={classes.compress_title}>
              {translations[lang]["upload_Image"]}
            </h2>
            <div
              className={classes.input_section}
              onDragOver={(e) => e.preventDefault()}
              onDrag={handleDrop}>
              <img
                className={classes.dn_img}
                src="./images/download.png"
                alt="img"
              />
              <h3>{translations[lang]["Choose"]}</h3>
              <p>{translations[lang]["support"]} png, jpg, jpeg </p>
              <button className={classes.select}>
                {translations[lang]["select"]}
              </button>
              <input
                id="web-worker"
                type="file"
                accept="image/*"
                onChange={(e) => compressImage(e, true)}
                className={classes.input_file}
              />
            </div>
          </div>
        )}

        {isImageLoaded && (
          <div className={classes.preview}>
            <div className={classes.preview_block}>
              <h3>{translations[lang]["Input preview"]}</h3>

              <div className={classes.preview_container}>
                <h4>
                  {compressionState?.webWorker?.fileName?.replace(
                    "compressed_",
                    ""
                  )}
                </h4>
                <img
                  src={
                    compressionState.mainThread.inputUrl ||
                    compressionState.webWorker.inputUrl ||
                    ""
                  }
                  alt="Input Preview"
                />
              </div>
            </div>

            <div className={classes.output_block}>
              <h3>{translations[lang]["Output preview"]}</h3>
              <div className={classes.preview_container}>
                <h4>{compressionState?.webWorker?.fileName}</h4>
                <img
                  src={
                    compressionState.mainThread.outputUrl ||
                    compressionState.webWorker.outputUrl ||
                    ""
                  }
                  alt="Output Preview"
                />
              </div>
              {/* {compressionState.webWorker.progress !== null && (
                            <div className={classes.progress}>
                                <div className={classes.progressBar}>
                                    <div
                                        className={classes.progressFill}
                                        style={{
                                            width: `${compressionState.webWorker.progress}%`,
                                        }}
                                    ></div>
                                </div>
                                <p>{compressionState.webWorker.progress}%</p>
                            </div>
                        )} */}
              {compressionState.webWorker.error && (
                <p className={classes.error}>
                  {compressionState.webWorker.error}
                </p>
              )}
              <div className={classes.compress_text}>
                {(compressionState.webWorker.inputSize ||
                  compressionState.webWorker.outputSize) && (
                  <p className={classes.info}>
                    {compressionState.webWorker.inputSize && (
                      <span>
                        {translations[lang]["Source"]} :{" "}
                        {compressionState.webWorker.inputSize} MB
                      </span>
                    )}
                    {compressionState.webWorker.outputSize && (
                      <span>
                        {" "}
                        {translations[lang]["Output"]} :{" "}
                        {compressionState.webWorker.outputSize} MB
                      </span>
                    )}
                  </p>
                )}
                <div className={classes.buttonGroup}>
                  {compressionState.webWorker.outputUrl && (
                    <button
                      onClick={() => handleDownload("webWorker")}
                      className={classes.downloadButton}>
                      {translations[lang]["Download"]}
                    </button>
                  )}
                  <button
                    onClick={() => resetState("webWorker")}
                    className={classes.resetButton}>
                    {translations[lang]["Reset"]}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
};

export default ImageCompressor;
