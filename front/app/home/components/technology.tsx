"use client";
import { FC } from "react";
import classes from "../styles/technology.module.scss";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Image from "next/image";
import Slider from "react-slick";
import { ReactTyped } from "react-typed";

const Technology: FC = () => {
  const leng = useAppSelector((state) => state.translation.leng);
  let icons = [
    "tech1.svg",
    "tech2.svg",
    "tech3.svg",
    "tech4.svg",
    "tech5.svg",
    "tech6.svg",
    "tech7.svg",
    "tech8.svg",
    "tech9.svg",
  ];

  const settings = {
    dots: false,
    autoplay: true,
    infinite: true,
    speed: 1000,
    autoplaySpeed: 3500,
    slidesToShow: 7,
    slidesToScroll: 1,
    arrows: false,
    pauseOnHover: false,
    initialSlide: 0,
    responsive: [
      {
        breakpoint: 960,
        settings: {
          slidesToShow: 5,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 375,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
  };

  const List = icons.map((el: any, i: number): JSX.Element => {
    return (
      <div key={i} className={classes["image"]}>
        <Image src={`/icons/${el}`} alt={"img"} width={160} height={160} />
      </div>
    );
  });
  return (
    <div className={classes["technology"]}>
      <h2>
        <span className={classes["line"]}></span>
        <b>
          <ReactTyped
            strings={[`${translations[leng]["we_use"]}`]}
            typeSpeed={40}
            className={classes.line1}
            showCursor={true}
            startWhenVisible
          />
        </b>
      </h2>

      <div className={classes["main-container"]}>
        <div className={classes["slider-container"]}>
          <Slider {...settings}>{List}</Slider>
        </div>
      </div>
    </div>
  );
};

export default Technology;
