import { Dispatch, FC, SetStateAction } from "react";
import classes from "../styles/messageSide.module.scss";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { translations } from "@/app/redux/features/translations/initialtranslations";

interface Props {
    text: string;
    setText: Dispatch<SetStateAction<string>>;
    handleActive: () => void;
}

const MessageSide: FC<Props> = ({ text, setText, handleActive }) => {
    const lang = useAppSelector((state) => state.translation.leng);

    return (
        <div className={classes.mes_container}>
            <h3>{translations[lang]["Requirements"]}</h3>
            <textarea
                className={classes.text}
                value={text}
                placeholder={translations[lang]["order_message"]}
                name=""
                id=""
                onChange={(e) => {
                    setText(e.target.value);
                    handleActive();
                }}
            ></textarea>
        </div>
    );
};

export default MessageSide;
