import { FC } from "react";
import styles from "./page.module.scss";
import Slider from "./components/slider";

const Calculator: FC = () => {
    return (
        <div className={`${styles.container}`}>
            <Slider />
        </div>
    );
};

export default Calculator;
