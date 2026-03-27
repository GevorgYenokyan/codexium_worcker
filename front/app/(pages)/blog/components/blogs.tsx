"use client";
import { FC, useEffect, useState } from "react";
import classes from "../blog.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Image from "next/image";
import { ReactTyped } from "react-typed";
import { useGetNewsQuery } from "@/app/redux/features/api/codexiumApi";
import Link from "next/link";
import Pagination from "@/app/modules/pagination/pagination";
const Blogs: FC = () => {
    const leng = useAppSelector((state) => state.translation.leng);

    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 0
    );
    const [page, setPage] = useState(1);

    const { data, isLoading } = useGetNewsQuery({
        limit: windowWidth > 720 ? 4 : 3,
        page,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);
    const blogs = data?.message.map((el: any, i: number) => {
        const title = leng === "arm" ? el.title : el.title_eng;
        const desc = leng === "arm" ? el.description : el.description_eng;
        let date = new Date(el.updatedAt);

        return (
            <div key={i} className={classes["project"]}>
                <div className={classes["elem"]}>
                    <div className={classes["projectImage"]}>
                        <Image
                            src={`https://codexium.it/${el.image}`}
                            alt={title}
                            width={300}
                            height={280}
                        />
                    </div>
                    <div className={classes["projectInfo"]}>
                        <span className={classes["date"]}>
                            {translations[leng]["months"][date.getMonth()] +
                                " " +
                                date.getDate() +
                                ", " +
                                date.getFullYear()}
                        </span>
                        <h4>{title}</h4>
                        <p>{desc.slice(0, 80)} ...</p>
                        <Link href={`/blog/${el?.id}`} className={classes["readMore"]}>
                            {translations[leng]["readMore"]}
                        </Link>
                    </div>
                </div>
            </div>
        );
    });
    return (
      <div className={classes["container"]}>
        <h2>
          <span className={classes["line"]}></span>
          <b>
            <ReactTyped
              strings={[`${translations[leng]["menu"]["blog"]}`]}
              typeSpeed={40}
              className={classes.line1}
              showCursor={true}
              startWhenVisible
            />
          </b>
        </h2>
        <div className={classes["blogsContainer"]}>{blogs}</div>
        <Pagination
          limit={4}
          count={data?.count}
          onPageChange={(e) => setPage(e)}
          currentPage={data?.currentPage}
        />
      </div>
    );
};

export default Blogs;
