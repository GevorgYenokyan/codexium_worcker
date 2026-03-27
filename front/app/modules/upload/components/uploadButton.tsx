"use client";
import React, { forwardRef } from "react";
import classes from "../style/uploadButton.module.scss";

interface UploadButtonProps {
    onFilesSelected: (files: FileList) => void;
}

export const UploadButton = forwardRef<HTMLInputElement, UploadButtonProps>(
    ({ onFilesSelected }, ref) => {
        const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = event.target.files;
            if (files) onFilesSelected(files);
        };

        return (
            <div className={classes["upload-button"]} onClick={(e) => e.stopPropagation()}>
                <label className={classes["cursor-pointer"]}>
                    <input
                        ref={ref}
                        type="file"
                        multiple
                        className={classes["hidden-input"]}
                        onChange={handleFileChange}
                    />
                    <span className={classes["label-text"]}>Click to upload image</span>
                </label>
            </div>
        );
    }
);

UploadButton.displayName = "UploadButton";
