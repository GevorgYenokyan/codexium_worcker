import { FC } from "react";
import styles from "./page.module.scss";
import MainCard from "./components/mainCard";

const Page: FC = () => {
    return (
        <div className={styles.container}>
            <MainCard />
        </div>
    );
};

export default Page;
