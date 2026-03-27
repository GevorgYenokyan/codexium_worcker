import Image from "next/image";
import BackgroundRemover from "./components/backgroundRemover";
import classes from "./page.module.scss";

export default function Page() {
    return (
        <div className={classes.container}>
            <Image
                src="/icons/left.svg"
                width={200}
                height={320}
                alt="arrow"
                className={classes["right"]}
                priority
            />
            <BackgroundRemover />
        </div>
    );
}
