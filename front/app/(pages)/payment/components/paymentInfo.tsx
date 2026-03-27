import { FC } from "react";
import classes from "../style/paymentInfo.module.scss";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { useSearchParams } from "next/navigation";

const PaymentInfo: FC = () => {
    const lang = useAppSelector((state) => state.translation.leng);
    const params = useSearchParams();
    const currency: string = params.get("currency") || "";
    const cost = params.get("cost") || "1";

    let paymentCost = currency === "AMD" ? cost : (+cost / 380).toFixed(0);

    return (
        <div className={classes.payment_nfo}>
            <div className={classes.payment_title}>
                <img src="/icons/basket.png" alt="" />
                <h2 className={classes.title}>{translations[lang]["order_summary"]}</h2>
            </div>

            <div className={classes.order}>
                <h3>{translations[lang]["Order Total"]}</h3>
                <p>
                    {currency === "AMD" ? "AMD" : "$"}{" "}
                    {currency === "AMD" ? cost : (+cost / 380).toFixed(0)}
                </p>
            </div>

            <div className={classes.percent}>
                <img src="/icons/percent.png" alt="" />
                <h3>{translations[lang]["Deposit Required"]}</h3>
            </div>
            <div className={classes.details}>
                <div className={classes.deposit}>
                    <div className={classes.cost}>
                        <h3>{translations[lang]["Deposit Amount (10%)"]}</h3>
                        <p>
                            {currency === "AMD" ? "AMD" : "$"}
                            {((+paymentCost * 10) / 100).toFixed(0)}
                        </p>
                    </div>

                    <div className={classes.cost}>
                        <h3>{translations[lang]["Remaining Balance"]}</h3>
                        <h4>
                            {currency === "AMD" ? "AMD" : "$"}
                            {currency === "AMD" ? cost : (+cost / 380).toFixed(0)}
                        </h4>
                    </div>
                </div>

                <div className={classes["payments"]}>
                    <h3>
                        <span></span> {translations[lang]["Today's Payment"]}
                    </h3>

                    <h4>
                        {currency === "AMD" ? "AMD" : "$"}
                        {currency === "AMD" ? cost : (+cost / 380).toFixed(0)}
                    </h4>

                    <p>{translations[lang]["payment_text"]}</p>
                </div>

                <div className={classes.secure}>
                    <h3>
                        <span></span> {translations[lang]["Secure Payment"]}
                    </h3>

                    <p>{translations[lang]["secure_text"]}</p>

                    <div className={classes.icons}>
                        <p>
                            <p>{translations[lang]["Accepted"]}</p>
                        </p>
                        <img src="/icons/visa.png" alt="Visa" />
                        <img src="/icons/mastercard.png" alt="MasterCard" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentInfo;
