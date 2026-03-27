import localFont from "next/font/local";
const MontseratLight = localFont({
  src: [
    {
      path: "../assets/fonts/Montseratt/light/Montserratarm-Light.woff",
      weight: "normal",
      style: "normal",
    },
    {
      path: "../assets/fonts/Montseratt/light/Montserratarm-Light.otf",
      weight: "normal",
      style: "normal",
    },
    {
      path: "../assets/fonts/Montseratt/light/Montserratarm-Light.ttf",
      weight: "normal",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--MontseratLight",
});

const MontseratSemiBold = localFont({
    src: [
        {
            path: "../assets/fonts/Montseratt/semiBold/Montserratarm-SemiBold.woff",
            weight: "normal",
            style: "normal",
        },
        {
            path: "../assets/fonts/Montseratt/semiBold/Montserratarm-SemiBold.otf",
            weight: "normal",
            style: "normal",
        },
        {
            path: "../assets/fonts/Montseratt/semiBold/Montserratarm-SemiBold.ttf",
            weight: "normal",
            style: "normal",
        },
    ],
    display: "swap",
    variable: "--MontseratSemiBold",
});

const MontseratBold = localFont({
  src: [
    {
      path: "../assets/fonts/Montseratt/bold/Montserrat-ExtraBold.ttf",
      weight: "bold",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--MontseratBold",
});
const MontserratRegular = localFont({
  src: [
    {
      path: "../assets/fonts/Montseratt/regular/Montserratarm-Regular.otf",
      weight: "normal",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--MontserratRegular",
});
export { MontseratLight, MontseratSemiBold, MontserratRegular, MontseratBold };
