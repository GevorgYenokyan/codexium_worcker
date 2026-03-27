"use client";
import Image, { ImageProps } from "next/image";
import { FC, useMemo } from "react";

type CustomImageProps = Omit<ImageProps, "src"> & { src?: string };

const FALLBACK_SRC = "/images/logoImg.png";

const CustomImage: FC<CustomImageProps> = ({ src, ...props }) => {
    // const srcLink = useMemo(() => {
    //     if (!src || src === "undefined") return FALLBACK_SRC;
    //     return src.startsWith("http") ? src : `http://localhost:7000/${src}`;
    // }, [src]);

    return (
        <Image
            {...props}
            src={`http://localhost:7000/${src}`}
            placeholder="blur"
            blurDataURL={FALLBACK_SRC}
            onError={() => FALLBACK_SRC}
        />
    );
};

export default CustomImage;

// "use client";
// import Image, { ImageProps } from "next/image";
// import { FC, ImgHTMLAttributes, useRef } from "react";

// type CustomImageProps = ImageProps & ImgHTMLAttributes<HTMLImageElement>;

// const CustomImage: FC<CustomImageProps> = ({ src, ...props }) => {
//     const imageRef = useRef<HTMLImageElement>(null);
//     const srcLink =
//         Boolean(src) && src !== "undefined"
//             ? `http://localhost:3000/${src}`
//             : "/images/logoImg.png";
//     return (
//         <Image
//             {...props}
//             src={srcLink}
//             quality={50}
//             ref={imageRef}
//             placeholder={"blur"}
//             blurDataURL="/images/logoImg.png"
//             onError={(e) => {
//                 if (imageRef.current) {
//                     imageRef.current.src = "/images/logoImg.png";
//                 }
//             }}
//         />
//     );
// };

// export default CustomImage;
