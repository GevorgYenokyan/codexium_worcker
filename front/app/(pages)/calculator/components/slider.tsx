"use client";

import { FC, useRef, useState, useCallback, useEffect } from "react";
import classes from "../styles/slider.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Modules from "./modules";
import MessageSide from "./messageSide";
import { useGetUserByIdQuery, useSiteOrderMutation } from "@/app/redux/features/api/codexiumApi";
import { Button } from "@/app/shared/ui/buttons/button";
import ConfirmModal from "@/app/components/confirmModal/confirmModal";
import { useRouter } from "next/navigation";
import { ReactTyped } from "react-typed";

const ticks = [350_000, 500_000, 750000, 1_000_000, 1_200_000, 1_500_000, 1_800_000, 2_000_000];
const min = ticks[0];
const max = ticks[ticks.length - 1];
const defaultValue = ticks[0];

interface SliderProps {
    min?: number;
    max?: number;
    defaultValue?: number;
}

function roundDownHundreds(num: number) {
    return Math.floor(num / 100) * 100;
}

interface Module {
    id: number;
    name: string;
    name_eng: string;
    price: number;
    image: string | null;
    checked?: boolean;
}

const Slider: FC<SliderProps> = ({}) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const elemRef = useRef<HTMLDivElement>(null);
    const parentRef = useRef<HTMLDivElement>(null);
    const [value, setValue] = useState(defaultValue);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState(0);
    const lang = useAppSelector((state) => state.translation.leng);
    const [currency, setCurrency] = useState("AMD");
    const [text, setText] = useState("");
    const [elements, setElements] = useState<Module[]>([]);
    const [range, setRange] = useState(defaultValue);
    const { data } = useGetUserByIdQuery({});
    const [isVisible, setIsVisible] = useState(false);
    const [addOrder, { isLoading, isSuccess, isError, error }] = useSiteOrderMutation();
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const onChange = (value: number) => {};

    const findClosestTick = useCallback((calculatedValue: number): number => {
        return ticks.reduce((prev, curr) =>
            Math.abs(curr - calculatedValue) < Math.abs(prev - calculatedValue) ? curr : prev
        );
    }, []);

    const handleActive = () => {
        setIsActive(true);
    };

    const calculatePosition = useCallback(
        (clientX: number): number => {
            handleActive();
            if (!sliderRef.current) return 0;

            const sliderRect = sliderRef.current.getBoundingClientRect();
            let newPosition = clientX - sliderRect.left;

            const maxPosition = sliderRect.width - (thumbRef.current?.offsetWidth || 20);
            newPosition = Math.max(0, Math.min(newPosition, maxPosition));

            const percentage = newPosition / maxPosition;
            const newValue = min + percentage * (max - min);

            // Snap to nearest tick
            const closestTick = findClosestTick(newValue);
            return ((closestTick - min) / (max - min)) * maxPosition;
        },
        [min, max, findClosestTick, isActive]
    );

    const getValue = useCallback(
        (position: number): number => {
            if (!sliderRef.current) return min;
            const maxPosition =
                sliderRef.current.offsetWidth - (thumbRef.current?.offsetWidth || 20);
            const percentage = position / maxPosition;
            const calculatedValue = min + percentage * (max - min);
            return findClosestTick(calculatedValue);
        },
        [min, max, findClosestTick]
    );

    const handleMove = useCallback(
        (clientX: number) => {
            if (!isDragging) return;
            const newPosition = calculatePosition(clientX);
            const newValue = getValue(newPosition);
            setValue(newValue);
            onChange?.(newValue);
            setRange(newValue);
        },
        [isDragging, calculatePosition, getValue, onChange]
    );

    const handleMouseDown = useCallback(() => {
        setIsDragging(true);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            handleMove(e.clientX);
        },
        [handleMove]
    );

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            e.preventDefault();
            handleMove(e.touches[0].clientX);
        },
        [handleMove]
    );

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const newPosition = calculatePosition(e.clientX);
            const newValue = getValue(newPosition);
            setValue(newValue);
            setRange(newValue);
            onChange?.(newValue);
        },
        [calculatePosition, getValue, onChange]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            const currentIndex = ticks.indexOf(value);
            let newIndex = currentIndex;

            const newValue = ticks[newIndex];
            setValue(newValue);
            setRange(newValue);
            onChange?.(newValue);
        },
        [value, onChange, range]
    );

    // ИСПРАВЛЕНИЕ БАГА: функция для клика на тик
    const handleTickClick = useCallback(
        (tickValue: number) => {
            handleActive();
            setValue(tickValue);
            setRange(tickValue);
            onChange?.(tickValue);
        },
        [onChange]
    );

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("touchmove", handleTouchMove, { passive: false });
            window.addEventListener("mouseup", handleMouseUp);
            window.addEventListener("touchend", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchend", handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleTouchMove, handleMouseUp]);

    useEffect(() => {
        if (!sliderRef.current || !elemRef.current) return;
        const parentRect = sliderRef.current.getBoundingClientRect();
        const childRect = elemRef.current.getBoundingClientRect();

        const relativeLeft = childRect.left - parentRect.left;

        setPosition(relativeLeft);
    }, [value]);

    useEffect(() => {
        if (data?.id) {
            setIsVisible(false);
        } else {
            setIsVisible(true);
        }
    }, [data]);

    const onsubmit = () => {
        if (data?.id) {
            router.push(`/payment?cost=${value}&currency=${currency}`);
        } else {
            setIsVisible(true);
        }
    };

    useEffect(() => {
        if (isSuccess) {
            setIsOpen(true);
        }
    }, [isSuccess, isError]);

    const list = ticks.map((el, i) => {
        return (
            <div
                tabIndex={-1}
                key={i}
                className={`${classes.ellipse} ${i === 0 && classes.first}
                ${i === ticks.length - 1 && classes.last} ${currency === "USD" && classes.usd}`}
                onClick={(e) => {
                    e.stopPropagation();
                    handleTickClick(el);
                }}
            >
                <div
                    ref={value === el ? elemRef : undefined}
                    className={`${classes.circle} ${value === el && classes.show}
                     
                
                `}
                ></div>
                <h4>
                    {currency === "AMD" ? el : roundDownHundreds(+(el / 380).toFixed(0))}

                    <p>{currency === "AMD" ? "AMD" : "USD"}</p>
                </h4>
            </div>
        );
    });

    return (
        <div className={`${classes.container}`}>
            <div className={classes.currency_block}>
                <h2>
                    <span className={classes["line"]}></span>
                    <b>
                        <ReactTyped
                            strings={[`${translations[lang]["menu"]["get_website"]}`]}
                            typeSpeed={40}
                            className={classes.line1}
                            showCursor={true}
                            startWhenVisible
                        />
                    </b>
                </h2>

                <div className={classes.Switch}>
                    <h3 className={classes.currency}>{translations[lang]["currency"]}</h3>

                    <div className={classes["currency_container"]}>
                        <div
                            onClick={() => {
                                setCurrency("AMD");
                            }}
                            className={`${classes["currency_btn"]} ${
                                currency == "AMD" ? classes["active"] : ""
                            }`}
                        >
                            AMD
                        </div>
                        <div
                            onClick={() => {
                                setCurrency("USD");
                            }}
                            className={`${classes["currency_btn"]} ${
                                currency == "USD" ? classes["active"] : ""
                            }`}
                        >
                            USD
                        </div>
                    </div>
                </div>
            </div>
            <div className={classes.slide_block}>
                <div ref={sliderRef} className={classes.slider} onClick={handleClick}>
                    <div className={classes.filledTrack}></div>
                    <div
                        ref={thumbRef}
                        className={`${classes.thumb} ${isDragging ? classes.dragging : ""} ${
                            ticks.includes(value) && classes.hidden
                        }`}
                        style={{ left: `${position}px` }}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleMouseDown}
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                        role="slider"
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={value}
                    />
                    {list}
                </div>
            </div>
            <div className={classes.valueDisplay}>
                {currency === "AMD"
                    ? value.toLocaleString()
                    : roundDownHundreds(+(+value / 380).toFixed(0))}{" "}
                {currency === "AMD" ? "AMD" : "USD"}
            </div>
            <Modules
                value={value}
                setValue={setValue}
                range={range}
                elements={elements}
                setElements={setElements}
                handleActive={handleActive}
            />
            <MessageSide text={text} setText={setText} handleActive={handleActive} />

            <div className={classes.btn_container}>
                <Button className={`${isActive && classes.active}`} onClick={onsubmit}>
                    {translations[lang]["Submit Order"]}
                </Button>
            </div>

            <ConfirmModal
                isOpen={isVisible}
                onClose={() => {
                    setIsVisible(false);
                }}
                message="Only authorized users can place orders"
                onConfirm={() => {
                    router.push("/registration");
                }}
                text={translations[lang]["Register"]}
                cancel={translations[lang]["Login"]}
                onCancel={() => {
                    router.push("/login");
                }}
            />

            <ConfirmModal
                isOpen={isOpen}
                onClose={() => {
                    setIsOpen(false);
                }}
                message="your order has been successfully placed"
                onConfirm={() => {
                    setIsOpen(false);
                }}
                text="register"
                description="Our team will contact you soon to clarify the details"
            />
        </div>
    );
};

export default Slider;

// "use client";

// import { FC, useRef, useState, useCallback, useEffect } from "react";
// import classes from "../styles/slider.module.scss";
// import { translations } from "@/app/redux/features/translations/initialtranslations";
// import { useAppSelector } from "@/app/redux/reduxHuks";
// import Modules from "./modules";
// import MessageSide from "./messageSide";
// import { useGetUserByIdQuery, useSiteOrderMutation } from "@/app/redux/features/api/codexiumApi";
// import { Button } from "@/app/shared/ui/buttons/button";
// import ConfirmModal from "@/app/components/confirmModal/confirmModal";
// import { useRouter } from "next/navigation";
// import { ReactTyped } from "react-typed";

// const ticks = [350_000, 500_000, 750000, 1_000_000, 1_200_000, 1_500_000, 1_800_000, 2_000_000];
// const min = ticks[0];
// const max = ticks[ticks.length - 1];
// const defaultValue = ticks[0];

// interface SliderProps {
//     min?: number;
//     max?: number;
//     defaultValue?: number;
// }

// function roundDownHundreds(num: number) {
//     return Math.floor(num / 100) * 100;
// }

// interface Module {
//     id: number;
//     name: string;
//     name_eng: string;
//     price: number;
//     image: string | null;
//     checked?: boolean;
// }

// const Slider: FC<SliderProps> = ({}) => {
//     const sliderRef = useRef<HTMLDivElement>(null);
//     const thumbRef = useRef<HTMLDivElement>(null);
//     const elemRef = useRef<HTMLDivElement>(null);
//     const parentRef = useRef<HTMLDivElement>(null);
//     const [value, setValue] = useState(defaultValue);
//     const [isDragging, setIsDragging] = useState(false);
//     const [position, setPosition] = useState(0);
//     const lang = useAppSelector((state) => state.translation.leng);
//     const [currency, setCurrency] = useState("AMD");
//     const [text, setText] = useState("");
//     const [elements, setElements] = useState<Module[]>([]);
//     const [range, setRange] = useState(defaultValue);
//     const { data } = useGetUserByIdQuery({});
//     const [isVisible, setIsVisible] = useState(false);
//     const [addOrder, { isLoading, isSuccess, isError, error }] = useSiteOrderMutation();
//     const [isActive, setIsActive] = useState(false);
//     const [isOpen, setIsOpen] = useState(false);
//     const router = useRouter();
//     const onChange = (value: number) => {};

//     const findClosestTick = useCallback((calculatedValue: number): number => {
//         return ticks.reduce((prev, curr) =>
//             Math.abs(curr - calculatedValue) < Math.abs(prev - calculatedValue) ? curr : prev
//         );
//     }, []);

//     const handleActive = () => {
//         setIsActive(true);
//     };

//     const calculatePosition = useCallback(
//         (clientX: number): number => {
//             handleActive();
//             if (!sliderRef.current) return 0;

//             const sliderRect = sliderRef.current.getBoundingClientRect();
//             let newPosition = clientX - sliderRect.left;

//             const maxPosition = sliderRect.width - (thumbRef.current?.offsetWidth || 20);
//             newPosition = Math.max(0, Math.min(newPosition, maxPosition));

//             const percentage = newPosition / maxPosition;
//             const newValue = min + percentage * (max - min);

//             // Snap to nearest tick
//             const closestTick = findClosestTick(newValue);
//             return ((closestTick - min) / (max - min)) * maxPosition;
//         },
//         [min, max, findClosestTick, isActive]
//     );

//     const getValue = useCallback(
//         (position: number): number => {
//             if (!sliderRef.current) return min;
//             const maxPosition =
//                 sliderRef.current.offsetWidth - (thumbRef.current?.offsetWidth || 20);
//             const percentage = position / maxPosition;
//             const calculatedValue = min + percentage * (max - min);
//             return findClosestTick(calculatedValue);
//         },
//         [min, max, findClosestTick]
//     );1

//     const handleMove = useCallback(
//         (clientX: number) => {
//             if (!isDragging) return;
//             const newPosition = calculatePosition(clientX);
//             const newValue = getValue(newPosition);
//             setValue(newValue);
//             onChange?.(newValue);
//             setRange(newValue);
//         },
//         [isDragging, calculatePosition, getValue, onChange]
//     );

//     const handleMouseDown = useCallback(() => {
//         setIsDragging(true);
//     }, []);

//     const handleMouseUp = useCallback(() => {
//         setIsDragging(false);
//     }, []);

//     const handleMouseMove = useCallback(
//         (e: MouseEvent) => {
//             handleMove(e.clientX);
//         },
//         [handleMove]
//     );

//     const handleTouchMove = useCallback(
//         (e: TouchEvent) => {
//             e.preventDefault();
//             handleMove(e.touches[0].clientX);
//         },
//         [handleMove]
//     );

//     const handleClick = useCallback(
//         (e: React.MouseEvent<HTMLDivElement>) => {
//             const newPosition = calculatePosition(e.clientX);
//             const newValue = getValue(newPosition);
//             setValue(newValue);
//             setRange(newValue);
//             onChange?.(newValue);
//         },
//         [calculatePosition, getValue, onChange]
//     );

//     const handleKeyDown = useCallback(
//         (e: React.KeyboardEvent<HTMLDivElement>) => {
//             const currentIndex = ticks.indexOf(value);
//             let newIndex = currentIndex;

//             const newValue = ticks[newIndex];
//             setValue(newValue);
//             setRange(newValue);
//             onChange?.(newValue);
//         },
//         [value, onChange, range]
//     );

//     useEffect(() => {
//         if (isDragging) {
//             window.addEventListener("mousemove", handleMouseMove);
//             window.addEventListener("touchmove", handleTouchMove, { passive: false });
//             window.addEventListener("mouseup", handleMouseUp);
//             window.addEventListener("touchend", handleMouseUp);
//         }
//         return () => {
//             window.removeEventListener("mousemove", handleMouseMove);
//             window.removeEventListener("touchmove", handleTouchMove);
//             window.removeEventListener("mouseup", handleMouseUp);
//             window.removeEventListener("touchend", handleMouseUp);
//         };
//     }, [isDragging, handleMouseMove, handleTouchMove, handleMouseUp]);

//     // const position = elemRef?.current ? elemRef?.current?.getBoundingClientRect().x : 0;

//     useEffect(() => {
//         if (!sliderRef.current || !elemRef.current) return;
//         const parentRect = sliderRef.current.getBoundingClientRect();
//         const childRect = elemRef.current.getBoundingClientRect();

//         const relativeLeft = childRect.left - parentRect.left;

//         setPosition(relativeLeft);
//     }, [value]);

//     useEffect(() => {
//         if (data?.id) {
//             setIsVisible(false);
//         } else {
//             setIsVisible(true);
//         }
//     }, [data]);

//     const onsubmit = () => {
//         if (data?.id) {
//             // addOrder({
//             //     userId: data?.id,
//             //     name: data?.name,
//             //     email: data?.email,
//             //     phone: data?.phone,
//             //     description: text,
//             //     status: "pending",
//             //     modules: JSON.stringify(elements),
//             // });
//             router.push(`/payment?cost=${value}&currency=${currency}`);
//         } else {
//             setIsVisible(true);
//         }
//     };

//     useEffect(() => {
//         if (isSuccess) {
//             setIsOpen(true);
//         }
//     }, [isSuccess, isError]);

//     const list = ticks.map((el, i) => {
//         return (
//             <div
//                 tabIndex={-1}
//                 key={i}
//                 className={`${classes.ellipse} ${i === 0 && classes.first}
//                 ${i === ticks.length - 1 && classes.last} ${currency === "USD" && classes.usd}`}
//                 onClick={() => setValue(el)}
//             >
//                 <div
//                     ref={value === el ? elemRef : undefined}
//                     className={`${classes.circle} ${value === el && classes.show}

//                 `}
//                 ></div>
//                 <h4>
//                     {currency === "AMD" ? el : roundDownHundreds(+(el / 380).toFixed(0))}

//                     <p>{currency === "AMD" ? "AMD" : "USD"}</p>
//                 </h4>
//             </div>
//         );
//     });

//     return (
//         <div className={`${classes.container}`}>
//             <div className={classes.currency_block}>
//                 <h2>
//                     <span className={classes["line"]}></span>
//                     <b>
//                         <ReactTyped
//                             strings={[`${translations[lang]["menu"]["get_website"]}`]}
//                             typeSpeed={40}
//                             className={classes.line1}
//                             showCursor={true}
//                             startWhenVisible
//                         />
//                     </b>
//                 </h2>

//                 <div className={classes.Switch}>
//                     <h3 className={classes.currency}>{translations[lang]["currency"]}</h3>

//                     <div className={classes["currency_container"]}>
//                         <div
//                             onClick={() => {
//                                 setCurrency("AMD");
//                             }}
//                             className={`${classes["currency_btn"]} ${
//                                 currency == "AMD" ? classes["active"] : ""
//                             }`}
//                         >
//                             AMD
//                         </div>
//                         <div
//                             onClick={() => {
//                                 setCurrency("USD");
//                             }}
//                             className={`${classes["currency_btn"]} ${
//                                 currency == "USD" ? classes["active"] : ""
//                             }`}
//                         >
//                             USD
//                         </div>
//                     </div>
//                 </div>
//             </div>
//             <div className={classes.slide_block}>
//                 <div ref={sliderRef} className={classes.slider} onClick={handleClick}>
//                     <div className={classes.filledTrack}></div>
//                     <div
//                         ref={thumbRef}
//                         className={`${classes.thumb} ${isDragging ? classes.dragging : ""} ${
//                             ticks.includes(value) && classes.hidden
//                         }`}
//                         style={{ left: `${position}px` }}
//                         onMouseDown={handleMouseDown}
//                         onTouchStart={handleMouseDown}
//                         onKeyDown={handleKeyDown}
//                         tabIndex={0}
//                         role="slider"
//                         aria-valuemin={min}
//                         aria-valuemax={max}
//                         aria-valuenow={value}
//                     />
//                     {list}
//                 </div>
//             </div>
//             <div className={classes.valueDisplay}>
//                 {currency === "AMD"
//                     ? value.toLocaleString()
//                     : roundDownHundreds(+(+value / 380).toFixed(0))}{" "}
//                 {currency === "AMD" ? "AMD" : "USD"}
//             </div>
//             <Modules
//                 value={value}
//                 setValue={setValue}
//                 range={range}
//                 elements={elements}
//                 setElements={setElements}
//                 handleActive={handleActive}
//             />
//             <MessageSide text={text} setText={setText} handleActive={handleActive} />

//             <div className={classes.btn_container}>
//                 <Button className={`${isActive && classes.active}`} onClick={onsubmit}>
//                     {translations[lang]["Submit Order"]}
//                 </Button>
//             </div>

//             <ConfirmModal
//                 isOpen={isVisible}
//                 onClose={() => {
//                     setIsVisible(false);
//                 }}
//                 message="Only authorized users can place orders"
//                 onConfirm={() => {
//                     router.push("/registration");
//                 }}
//                 text={translations[lang]["Register"]}
//                 cancel={translations[lang]["Login"]}
//                 onCancel={() => {
//                     router.push("/login");
//                 }}
//             />

//             <ConfirmModal
//                 isOpen={isOpen}
//                 onClose={() => {
//                     setIsOpen(false);
//                 }}
//                 message="your order has been successfully placed"
//                 onConfirm={() => {
//                     setIsOpen(false);
//                 }}
//                 text="register"
//                 description="Our team will contact you soon to clarify the details"
//             />
//         </div>
//     );
// };

// export default Slider;
