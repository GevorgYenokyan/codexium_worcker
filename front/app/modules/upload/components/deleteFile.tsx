import { Button } from "@/app/shared/ui/buttons/button";
import { Dispatch, FC, SetStateAction } from "react";

interface Props {
    files: File[];
    id: number;
    urls: string[];
    setUrls: Dispatch<SetStateAction<string[]>>;
    setFiles: Dispatch<SetStateAction<File[]>>;
}

const DeleteFile: FC<Props> = ({ files, id, setFiles, urls, setUrls }) => {
    const onDelete = (id: number) => {
        setFiles(files.filter((e, i) => i != id));
        setUrls(urls.filter((e, i) => i != id));
    };

    return <Button onClick={() => onDelete(id)}>Delete</Button>;
};

export default DeleteFile;
