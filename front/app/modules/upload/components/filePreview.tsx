"use client";

import React from "react";

interface FilePreviewProps {
    file: File;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
    return (
        <div className="">
            <p>{file.name}</p>
            <p>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>
    );
};
