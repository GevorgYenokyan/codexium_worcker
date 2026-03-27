"use client";
import { FC, useState } from "react";
import classes from "../style/backgroundRemover.module.scss";
import { removeBackground } from "./removeBackground";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { ReactTyped } from "react-typed";

export default function BackgroundRemover() {
    const [imageURL, setImageURL] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const lang = useAppSelector((state) => state.translation.leng);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const resultBlob = await removeBackground(file);
            const url = URL.createObjectURL(resultBlob);
            setImageURL(url);
        } catch (err) {
            console.error(err);
            // alert("Failed to remove background");
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement> | any) => {
        event.preventDefault();
        handleFileChange(event.dataTransfer.files);
    };

    return (
      <div className={classes.removeBg}>
        <h2>
          <span className={classes["line"]}></span>
          <b>
            <ReactTyped
              strings={[`${translations[lang]["remover"]}`]}
              typeSpeed={40}
              className={classes.line1}
              showCursor={true}
              startWhenVisible
            />
          </b>
        </h2>

        {/* <input type="file" accept="image/*" onChange={handleFileChange} /> */}
        {!imageURL && (
          <div className={classes.compressionSections}>
            <h2 className={classes.compress_title}>
              {translations[lang]["remove_image"]}
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
                onChange={handleFileChange}
                className={classes.input_file}
              />
            </div>
          </div>
        )}

        {loading && <p style={{ color: "white" }}>Removing background...</p>}
        {imageURL && (
          <div className={classes.image_block}>
            <img src={imageURL} alt="With background removed" />

            <div className={classes.buttons}>
              <a
                href={imageURL}
                download="codexium.png"
                className={classes.rm_button}>
                {translations[lang]["Download_bg"]}
              </a>

              <button
                className={classes.rm_button}
                onClick={() => {
                  setImageURL(null);
                }}>
                {translations[lang]["Try another one"]}
              </button>
            </div>
          </div>
        )}
      </div>
    );
}
