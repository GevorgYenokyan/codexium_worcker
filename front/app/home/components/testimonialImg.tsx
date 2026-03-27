import Image from "next/image";
import React, { FC, useState } from "react";

const TestimonialImg: FC<{ image: string }> = ({ image }) => {
    const [imgSrc, setImgSrc] = useState(
        image ? `https://codexium.it/${image}` : "/icons/User.svg"
    );

    return (
        <Image
            src={imgSrc}
            alt="img"
            width={400}
            height={200}
            onError={() => setImgSrc("/icons/User.svg")}
        />
    );
};

export default TestimonialImg;
