"use client";
import classes from "../style/portfolioList.module.scss";
import React, { FC, useState, useEffect } from "react";
import { useGetPortfoliosQuery } from "@/app/redux/features/api/codexiumApi";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Image from "next/image";
import Pagination from "@/app/modules/pagination/pagination";
import { Portfolio } from "@/app/types/types";
import PortfolioItem from "./portfolioItem";
import { RiCloseLargeLine } from "react-icons/ri";
import { ReactTyped } from "react-typed";
const PortfolioList: FC = () => {
    const lang = useAppSelector((state) => state.translation.leng);
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 0,
    );

    const [page, setPage] = useState(1);
    const [isOpen, setIsOpen] = useState(false);
    const [props, setProps] = useState<Partial<Portfolio>>({});
    const { data } = useGetPortfoliosQuery({
        limit: windowWidth > 720 ? 9 : 6,
        page,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const list = data?.message.map((el: Portfolio, i: number) => {
        return (
            <div key={i} className={classes["project"]}>
                <div
                    className={classes["projectItem"]}
                    onClick={() => {
                        setIsOpen(true);
                        setProps(el);
                    }}
                >
                    <div className={classes["projectImage"]}>
                        <Image
                            src={`https://codexium.it/${el.images[0]?.imagePath}`}
                            alt="img"
                            width={800}
                            height={400}
                            quality={100}
                            property=""
                        />
                    </div>
                    <div className={classes["projectHover"]}>
                        <h2>{el.title}</h2>
                    </div>
                </div>
            </div>
        );
    });

    return (
        <div className={classes.container}>
            <h2>
                <span className={classes["line"]}></span>
                <b>
                    <ReactTyped
                        strings={[`${translations[lang]["together"]}`]}
                        typeSpeed={40}
                        className={classes.line1}
                        showCursor={true}
                        startWhenVisible
                    />
                </b>
            </h2>

            <div className={classes.list_container}>{list}</div>
            <Pagination
                limit={windowWidth > 720 ? 6 : 3}
                count={data?.count}
                onPageChange={(e) => setPage(e)}
                currentPage={data?.currentPage}
            />

            <div className={`${classes.popup} ${isOpen && classes.open}`}>
                <div className={classes.popupContainer}>
                    <div onClick={() => setIsOpen(false)} className={classes.close}>
                        <RiCloseLargeLine />
                    </div>

                    {props && <PortfolioItem data={props} />}
                </div>
            </div>
        </div>
    );
};

export default PortfolioList;
