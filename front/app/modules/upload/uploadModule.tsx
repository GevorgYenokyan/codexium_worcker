"use client";

import { Dispatch, FC, SetStateAction, useRef, useState } from "react";
import classes from "./style/uploadModule.module.scss";
import { DragAndDropZone } from "./components/dragAndDropZone";
import { UploadButton } from "./components/uploadButton";
// import { FilePreview } from "./components/filePreview";
import { validateFile } from "./utils/fileValidation";
// import DeleteFile from "./components/deleteFile";
import Image from "next/image";

interface Urls {
    id: string | number;
    src: string;
}
interface UploadModuleProps {
    maxFileSize: number;
    allowedMimeTypes: string[];
    onFilesSelected?: (files: File[]) => void;
    onError?: (file: File, error: string) => void;
    files: File[];
    setFiles: Dispatch<SetStateAction<File[]>>;
    list?: boolean;
    setUrls: Dispatch<SetStateAction<Urls[]>>;
    urls: Urls[];
}

const UploadModule: FC<UploadModuleProps> = ({
    maxFileSize,
    allowedMimeTypes,
    onFilesSelected,
    onError,
    files,
    setFiles,
    list = true,
    setUrls,
    urls,
}) => {
    // const [urls, setUrls] = useState<Urls[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFiles = (selectedFiles: FileList) => {
        const validFiles: File[] = [];
        Array.from(selectedFiles).forEach((file) => {
            const validationError = validateFile(file, maxFileSize, allowedMimeTypes);
            const myUrl = window.URL
                ? window.URL.createObjectURL(file)
                : window.webkitURL.createObjectURL(file);
            if (list) {
                setUrls((prev) => [{ id: Math.random(), src: myUrl }, ...prev]);
            } else {
                setUrls([{ id: Math.random(), src: myUrl }]);
            }

            if (validationError && onError) {
                onError(file, validationError);
            } else {
                validFiles.unshift(file);
            }
        });
        if (list) {
            setFiles((prev) => [...Array.from(selectedFiles), ...prev]);
        } else {
            setFiles(Array.from(selectedFiles));
        }
        if (onFilesSelected) {
            onFilesSelected(validFiles);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };
    return (
        <div className={classes["upload-module"]}>
            <div onClick={handleClick}>
                <DragAndDropZone onFilesSelected={handleFiles}>
                    <Image src="/icons/addImg.png" alt="" width={30} height={30} />
                    <UploadButton onFilesSelected={handleFiles} ref={fileInputRef} />
                </DragAndDropZone>
            </div>
            {/* {files.map((file, i) => (
                <div key={file.name} className={classes["file-preview-container"]}>
                    <FilePreview file={file} />
                    <Image src={urls[i]} alt="image" width={150} height={200} />
                    <DeleteFile
                        files={files}
                        id={i}
                        setFiles={setFiles}
                        urls={urls}
                        setUrls={setUrls}
                    />
                </div>
            ))} */}
        </div>
    );
};

export default UploadModule;
