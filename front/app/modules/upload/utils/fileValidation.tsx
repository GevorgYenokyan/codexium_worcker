export const validateFile = (
    file: File,
    maxFileSize: number,
    allowedMimeTypes: string[]
): string | null => {
    if (file.size > maxFileSize) {
        return `File ${file.name} exceeds the maximum size of ${(
            maxFileSize /
            (1024 * 1024)
        ).toFixed(2)} MB.`;
    }

    if (!allowedMimeTypes.includes(file.type)) {
        return `File ${
            file.name
        } has an unsupported format. Allowed formats: ${allowedMimeTypes.join(", ")}.`;
    }

    return null;
};
