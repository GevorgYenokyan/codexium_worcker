"use client";
import { FC } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux/reduxHuks";
import { useGetNewsByIdQuery } from "@/app/redux/features/api/codexiumApi";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import classes from "../page.module.scss";
import Image from "next/image";

interface Props {
  id: string;
}

const BlogsPage: FC<Props> = ({ id }) => {
  const leng = useAppSelector((state) => state.translation.leng);
  const { data, isLoading } = useGetNewsByIdQuery(id);


  const title = leng === "arm" ? data?.title : data?.title_eng;
  const desc = leng === "arm" ? data?.description : data?.description_eng;
  return (
    <div className={classes["blog"]}>
      <h2>
        <div>
          <span className={classes["line"]}></span>
          <p>{translations[leng]["menu"]["blog"]}</p>
        </div>

        <div>
          <span className={classes["line"]}></span>
          <span className={classes["blogTitle"]}>{title}</span>
        </div>
      </h2>
      <div className={classes["projectImage"]}>
        <Image
          src={`https://codexium.it/${data?.image}`}
          alt={title}
          width={400}
          height={330}
        />
      </div>
      <h4>{title}</h4>
      <p className={classes["desc"]}>
        {desc}
      </p>
    </div>
  );
};

export default BlogsPage;
