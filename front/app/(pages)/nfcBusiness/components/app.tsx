"use client";
import { FC } from "react";
import classes from "../page.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import Image from "next/image";
import { ReactTyped } from "react-typed";
import Link from "next/link";
const App: FC = () => {
    const leng = useAppSelector((state) => state.translation.leng);
    return (
        <div>
            <div className={classes["container"]}>
                <div className={classes.title_container}>
                    <h2>
                        <span className={classes["line"]}></span>
                        <b>
                            <ReactTyped
                                strings={[`${translations[leng]["apptitle22"]}`]}
                                typeSpeed={40}
                                className={classes.line1}
                                showCursor={true}
                                startWhenVisible
                            />
                        </b>
                    </h2>

                    <Link href={"/nfcOrder"} className={classes.order_nfc}>
                        {translations[leng]["order_nfc"]}
                    </Link>
                </div>

                <p className={classes["subTitle"]}>{translations[leng]["appTitleText2"]}</p>
                <div className={classes["description"]}>
                    <p className={classes["desc"]}>{translations[leng]["appText12"]}</p>
                    <p className={classes["desc"]}>{translations[leng]["appText22"]}</p>

                    <p className={classes["our_app"]}>{translations[leng]["appAproach2"]}</p>

                    <div className={classes["up_chooseContainer"]}>
                        {translations[leng]["ourExp2"].map((el: string, i: number) => {
                            return (
                                <div key={i} className={classes["chooseItem"]}>
                                    <Image
                                        src="/icons/check.svg"
                                        width={32}
                                        height={32}
                                        alt="check"
                                        className={classes["check"]}
                                        priority
                                    />
                                    <p>{el}</p>
                                </div>
                            );
                        })}
                    </div>
                    <h2>
                        <p className={classes.our_approach}>{translations[leng]["appProcess"]}</p>
                    </h2>
                    <div className={classes["processContainer"]}>
                        {translations[leng]["appProcessItems2"].map((el: any, i: number) => {
                            return (
                                <div key={i} className={classes["process"]}>
                                    <div className={classes["processItem"]}>
                                        <h3>{el.title}</h3>
                                        <p>{el.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <h5>{translations[leng]["whyChoose"]}</h5>

                    <div className={classes["chooseContainer"]}>
                        {translations[leng]["whyChooseItemsApp2"].map((el: string, i: number) => {
                            return (
                                <div key={i} className={classes["chooseItem"]}>
                                    <Image
                                        src="/icons/check.svg"
                                        width={32}
                                        height={32}
                                        alt="check"
                                        className={classes["check"]}
                                        priority
                                    />
                                    <p>{el}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className={classes["business"]}>
                <p className={classes["businessContainer"]}>
                    {translations[leng]["yourBusinessApp2"]}
                </p>
                <Image
                    src="/icons/rightGreen.svg"
                    width={100}
                    height={100}
                    alt="rightGreen"
                    className={classes["rightGreen"]}
                    priority
                />
            </div>
        </div>
    );
};

export default App;

// <div className={classes["container"]}>
//       <h2>
//         <span className={classes["line"]}></span>
//         <p>{translations[leng]["menu"]["app"]}</p>
//       </h2>
//       <div className={classes["description"]}>
//         <p>{translations[leng]["appDesc"]}</p>
//         <p>{translations[leng]["appIncludes"]}</p>
//         <ul>
//           {translations[leng]["appIncludesItems"].map(
//             (el: string, i: number) => (
//               <li key={i}>{el}</li>
//             )
//           )}
//         </ul>
//         <p>{translations[leng]["appAproach"]}</p>
//         <ol>
//           {translations[leng]["approachItems"].map((el: string, i: number) => (
//             <li key={i}>{el}</li>
//           ))}
//         </ol>
//         <p>{translations[leng]["whyCode"]}</p>
//         <ul>
//           {translations[leng]["appArguments"].map((el: string, i: number) => (
//             <li key={i}>{el}</li>
//           ))}
//         </ul>
//         <p>{translations[leng]["appVision"]}</p>
//       </div>
//     </div>
