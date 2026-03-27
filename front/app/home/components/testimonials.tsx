"use client";
import { FC, useRef } from "react";
import classes from "../styles/testimonials.module.scss";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Image from "next/image";
import Slider from "react-slick";
import { useGetTestimonialsQuery } from "@/app/redux/features/api/codexiumApi";
import { FaAngleRight, FaAngleLeft } from "react-icons/fa6";
import {
  MdOutlineArrowBackIos,
  MdOutlineArrowForwardIos,
} from "react-icons/md";
import TestimonialImg from "./testimonialImg";
import { ReactTyped } from "react-typed";
const Testimonials: FC = () => {
  const leng = useAppSelector((state) => state.translation.leng);
  const { data, isLoading } = useGetTestimonialsQuery({ limit: 8 });

  const List = data?.message.map((el: any, i: number): JSX.Element => {
    const name = leng === "arm" ? el.name : el.name_eng;
    const lastName = leng === "arm" ? el.lastName : el.lastName_eng;
    const desc = leng === "arm" ? el.description : el.description_eng;
    const position = leng === "arm" ? el.position : el.position_eng;

    return (
      <div key={i} className={classes["testimonialsElem"]}>
        <div className={classes["elem"]}>
          <p className={classes["desc"]}>{desc}</p>
          <div className={classes["name"]}>
            {/* <Image
                            src={el.image ? `https://codexium.it/${el.image}` : "/icons/User.svg"}
                            alt={"img"}
                            width={400}
                            height={200}

                        /> */}
            {/* <TestimonialImg image={el.image} /> */}
            <b>
              {name} {lastName}
            </b>
            <span>{position}</span>
          </div>
        </div>
      </div>
    );
  });

  const useSlideRef = useRef<any>(null);
  function SampleNextArrow(props: any) {
    const { className, style, onClick } = props;
    return (
      <button
        className={classes["Next"]}
        onClick={() => {
          if (useSlideRef.current) {
            useSlideRef.current.slickNext();
          }
        }}>
        <FaAngleRight />
      </button>
    );
  }

  function SamplePrevArrow(props: any) {
    const { className, style, onClick } = props;
    return (
      <button
        className={classes["Prev"]}
        onClick={() => {
          if (useSlideRef.current) {
            useSlideRef.current.slickPrev();
          }
        }}>
        <FaAngleLeft />
      </button>
    );
  }
  let settings = {
    infinite: true,
    speed: 1500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    initialSlide: 0,
    autoplay: true,
    pauseOnHover: false,
    autoplaySpeed: 3500,
    // nextArrow: <SampleNextArrow />,
    // prevArrow: <SamplePrevArrow />,
    // adaptiveHeight: true,
    responsive: [
      {
        breakpoint: 960,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          initialSlide: 1,
        },
      },
      {
        breakpoint: 720,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className={classes["testimonials"]}>
      <div className={classes["sliderTitle"]}>
        <h2>
          <span className={classes["line"]}></span>
          <b>
            <ReactTyped
              strings={[`${translations[leng]["testimonials"]}`]}
              typeSpeed={40}
              className={classes.line1}
              showCursor={true}
              startWhenVisible
            />
          </b>
        </h2>
        <div className={classes["arrows"]}>
          <button
            className={`${classes["buttonPrev"]} ${
              (data?.message && data.message.length) <= 4 && classes["hide"]
            }`}
            onClick={() => {
              useSlideRef.current.slickPrev();
            }}>
            <MdOutlineArrowBackIos />
          </button>
          <button
            className={`${classes["buttonNext"]} ${
              (data?.message && data.message.length) <= 4 && classes["hide"]
            }`}
            onClick={() => {
              useSlideRef.current.slickNext();
            }}>
            <MdOutlineArrowForwardIos />
          </button>
        </div>
      </div>

      <div className={classes["main-container"]}>
        <div className="slider-container">
          {List?.length > 0 && (
            <Slider ref={useSlideRef} {...settings}>
              {List}
            </Slider>
          )}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
