"use client";
import classes from "../style/uploadModule.module.scss";
import { FC, ReactNode } from "react";

interface DragAndDropZoneProps {
    onFilesSelected: (files: FileList) => void;
    children: ReactNode;
}

export const DragAndDropZone: FC<DragAndDropZoneProps> = ({ onFilesSelected, children }) => {
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        onFilesSelected(event.dataTransfer.files);
    };

    return (
        <div
            className={classes["drag_drop_zone"]}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            {children}
            <p>PNG, JPG up to 5MB</p>
        </div>
    );
};
