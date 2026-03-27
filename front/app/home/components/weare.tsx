"use client";
import { FC, useState } from "react";
import classes from "../styles/weare.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Image from "next/image";
import { ReactTyped } from "react-typed";

const WeAre: FC = () => {
    const leng = useAppSelector((state) => state.translation.leng);
    const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
    const [imageError, setImageError] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement | any>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoverPos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const touch = e.touches[0];

        setHoverPos({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
        });
    };

    const handleMouseLeave = () => {
        setHoverPos(null);
    };

    return (
        <div
            className={classes["weAre"]}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseOver={handleMouseMove}
            onTouchMove={handleTouchMove}
        >
            <div
                className={classes["backgroundReveal"]}
                style={{
                    backgroundImage: imageError ? "none" : `url('/icons/code.jpg')`,
                    maskImage: hoverPos
                        ? `radial-gradient(circle 40px at ${hoverPos.x}px ${hoverPos.y}px, #000000b9 0%, #00000082 40px, transparent 81px)`
                        : `radial-gradient(circle 0px at 0px 0px, black 0%, black 0px, transparent 0px)`,
                    WebkitMaskImage: hoverPos
                        ? `radial-gradient(circle 40px at ${hoverPos.x}px ${hoverPos.y}px, #00000089 0%, #00000073 40px, transparent 81px)`
                        : `radial-gradient(circle 0px at 0px 0px, black 0%, black 0px, transparent 0px)`,
                }}
                onError={() => setImageError(true)}
            />
            {imageError && (
                <div className={classes["imageError"]}>Failed to load background image</div>
            )}

            <Image
                src="/icons/left.svg"
                width={200}
                height={320}
                alt="arrow"
                className={classes["right"]}
                priority
            />
            <div className={classes["weAreContainer"]}>
                <div className={classes["weText"]}>
                    <span className={classes["line"]}></span>

                    <p>
                        <ReactTyped
                            strings={[`${translations[leng]["we_text"]}`]}
                            typeSpeed={40}
                            className={classes.line1}
                            showCursor={true}
                        />
                    </p>
                </div>
                <div className={classes["animationContainer"]}>
                    <div className={classes["animation"]}>
                        <div className={classes["hide"]}></div>
                        <Image
                            className={classes["vector"]}
                            src="/icons/vector.svg"
                            width={110}
                            height={145}
                            alt="codexium"
                            priority
                        />
                        <div className={classes["codexium"]}>
                            <Image
                                src="/icons/Codexium.svg"
                                width={240}
                                height={50}
                                alt="codexium"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeAre;
