import { Button } from "@/app/shared/ui/buttons/button";
import classes from "../style/fileList.module.scss";
import { Dispatch, FC, memo, SetStateAction, useCallback } from "react";
import Image from "next/image";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { translations } from "@/app/redux/features/translations/initialtranslations";

interface Urls {
    id: string | number;
    src: string;
}

interface Props {
    files: File[];
    setFiles: (files: File[]) => void;
    setUrls: Dispatch<SetStateAction<Urls[]>>;
    urls: Urls[];
}

const FileList: FC<Props> = ({ files, setFiles, urls, setUrls }) => {
    const lang = useAppSelector((state) => state.translation.leng);

    const onDelete = (id: number) => {
        setFiles(files.filter((_, i) => i != id));
        setUrls(urls.filter((_, i) => i != id));
    };

    return (
        <div className={classes["files"]}>
            {urls.map((file, i) => (
                <div key={file.id} className={classes["file-preview-container"]}>
                    <Image
                        className={classes.preview_image}
                        src={urls[i].src}
                        alt="image"
                        width={150}
                        height={200}
                    />
                    <Button onClick={() => onDelete(i)}>{translations[lang]["Delete"]}</Button>
                </div>
            ))}
        </div>
    );
};

export default memo(FileList);
