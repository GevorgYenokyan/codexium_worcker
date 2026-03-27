// components/MouseCarousel.tsx
"use client";

import { useRef, useState, MouseEvent, TouchEvent } from "react";
import styles from "./carousel.module.scss";

interface MouseCarouselProps {
    items: React.ReactNode[];
    itemWidth?: string; // e.g., "300px", "50%", "20rem"
    itemHeight?: string; // e.g., "200px", "50%", "15rem"
}

const Carousel: React.FC<MouseCarouselProps> = ({
    items,
    itemWidth = "300px", // Default width
    itemHeight = "200px", // Default height
}) => {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [startX, setStartX] = useState<number>(0);
    const [scrollLeft, setScrollLeft] = useState<number>(0);

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (!carouselRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - carouselRef.current.offsetLeft);
        setScrollLeft(carouselRef.current.scrollLeft);
    };

    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        if (!carouselRef.current) return;
        setIsDragging(true);
        setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
        setScrollLeft(carouselRef.current.scrollLeft);
    };

    const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        if (!isDragging || !carouselRef.current) return;
        e.preventDefault();
        const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        carouselRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleEnd = () => {
        if (!carouselRef.current) return;
        setIsDragging(false);

        const itemWidth =
            carouselRef.current.querySelector(`.${styles.carouselItem}`)?.clientWidth || 0;
        const gap = 20;
        const threshold = itemWidth / 2;
        const currentScroll = carouselRef.current.scrollLeft;
        const dragDistance = currentScroll - scrollLeft;

        if (Math.abs(dragDistance) > threshold) {
            if (dragDistance > 0) {
                scrollToNext();
            } else {
                scrollToPrevious();
            }
        } else {
            carouselRef.current.scrollTo({
                left: scrollLeft,
                behavior: "smooth",
            });
        }
    };

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !carouselRef.current) return;
        e.preventDefault();
        const x = e.pageX - carouselRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        carouselRef.current.scrollLeft = scrollLeft - walk;
    };

    const scrollToPrevious = () => {
        if (!carouselRef.current) return;
        const itemWidth =
            carouselRef.current.querySelector(`.${styles.carouselItem}`)?.clientWidth || 0;
        const gap = 20;
        const currentScroll = carouselRef.current.scrollLeft;
        const targetScroll = Math.floor(currentScroll / (itemWidth + gap)) * (itemWidth + gap);

        carouselRef.current.scrollTo({
            left: targetScroll - (itemWidth + gap),
            behavior: "smooth",
        });
    };

    const scrollToNext = () => {
        if (!carouselRef.current) return;
        const itemWidth =
            carouselRef.current.querySelector(`.${styles.carouselItem}`)?.clientWidth || 0;
        const gap = 20;
        const currentScroll = carouselRef.current.scrollLeft;
        const targetScroll = Math.floor(currentScroll / (itemWidth + gap)) * (itemWidth + gap);

        carouselRef.current.scrollTo({
            left: targetScroll + (itemWidth + gap),
            behavior: "smooth",
        });
    };

    return (
        <div className={styles.carouselWrapper}>
            <button
                className={styles.navButton}
                onClick={scrollToPrevious}
                aria-label="Previous slide"
            >
                ‹
            </button>

            <div
                ref={carouselRef}
                className={styles.carouselContainer}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleEnd}
                onMouseUp={handleEnd}
                onMouseMove={handleMouseMove}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleEnd}
            >
                <div className={styles.carouselInner}>
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={styles.carouselItem}
                            style={{
                                width: itemWidth,
                                height: itemHeight,
                            }}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            <button className={styles.navButton} onClick={scrollToNext} aria-label="Next slide">
                ›
            </button>
        </div>
    );
};

export default Carousel;
