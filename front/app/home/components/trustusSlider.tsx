"use client";
import { FC } from "react";
import classes from "../styles/trustus.module.scss";
import Image from "next/image";
import Slider from "react-slick";
const TrustusSlider: FC = () => {
  const emptyStrings = Array(22).fill("");
  let List = emptyStrings.map((el: any, i: number): JSX.Element => {
    return (
      <Image
        key={i}
        src={`/icons/partners/${i + 1}.svg`}
        width={200}
        alt={"arrow"}
        height={88}
        className={classes["partnerImg"]}
      />
    );
  });

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
          slidesToShow: 4,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 460,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };
  return (
    <div className={classes["trustusSlider"]}>
      <div className={classes["slider-container"]}>
        <Slider {...settings}>
          {List}
          <Image
            src={`/icons/partners/VJmotors.png`}
            width={200}
            alt={"arrow"}
            height={88}
            className={classes["partnerImg"]}
          />
        </Slider>
      </div>
    </div>
  );
};

export default TrustusSlider;
