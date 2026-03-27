import React, { ChangeEvent, FC, useState } from "react";
import classes from "../style/card.module.scss";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import Link from "next/link";

const Card: FC = () => {
    const lang = useAppSelector((state) => state.translation.leng);
    const [checked, setChecked] = useState(false);
    const [values, setValues] = useState({
        card_number: "",
        expiry_date: "",
        cvv: "",
        cardholder_name: "",
        email: "",
        address: "",
        city: "",
        zip: "",
        agree: false,
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setValues({
            ...values,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (checked) {
            alert("You must agree to terms before continuing");
            return;
        }
    };

    return (
        <div className={classes.container}>
            <div className={classes.card_title}>
                <img src="/icons/payment.png" alt="" />
                  <h2 className={classes.title}>{translations[lang]["payment_information"]}</h2>
            </div>
            <form onSubmit={handleSubmit} className={classes.form}>
                <div className={classes.formGroup}>
                    <label>{translations[lang]["card_number"]}</label>
                    <input
                        type="text"
                        name="card_number"
                        placeholder="1234 5678 9012 3456"
                        onChange={handleChange}
                        value={values.card_number}
                    />
                </div>

                <div className={classes.row}>
                    <div className={classes.formGroup}>
                        <label>{translations[lang]["expiry_date"]}</label>
                        <input
                            type="text"
                            name="expiry_date"
                            placeholder="MM/YY"
                            onChange={handleChange}
                            value={values.expiry_date}
                        />
                    </div>
                    <div className={classes.formGroup}>
                        <label>CVV</label>
                        <input
                            type="text"
                            name="cvv"
                            placeholder="123"
                            onChange={handleChange}
                            value={values.cvv}
                        />
                    </div>
                </div>

                {/* Cardholder Name */}
                <div className={classes.formGroup}>
                    <label>{translations[lang]["cardholder_name"]}</label>
                    <input
                        type="text"
                        name="cardholder_name"
                        placeholder="John Doe"
                        onChange={handleChange}
                        value={values.cardholder_name}
                    />
                </div>

                {/* Billing Info */}
                <h3 className={classes.subtitle}>{translations[lang]["billing_information"]}</h3>

                <div className={classes.formGroup}>
                    <label>{translations[lang]["Email"]}</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="john@example.com"
                        onChange={handleChange}
                        value={values.email}
                    />
                </div>

                <div className={classes.formGroup}>
                    <label>{translations[lang]["Address"]}</label>
                    <input
                        type="text"
                        name="address"
                        placeholder="123 Main Street"
                        onChange={handleChange}
                        value={values.address}
                    />
                </div>

                <div className={classes.row}>
                    <div className={classes.formGroup}>
                        <label>{translations[lang]["City"]}</label>
                        <input
                            type="text"
                            name="city"
                            placeholder="New York"
                            onChange={handleChange}
                            value={values.city}
                        />
                    </div>
                    <div className={classes.formGroup}>
                        <label>{translations[lang]["Zip Code"]}</label>
                        <input
                            type="text"
                            name="zip"
                            placeholder="10001"
                            onChange={handleChange}
                            value={values.zip}
                        />
                    </div>
                </div>

                {/* Terms & Checkbox */}
                <div className={classes.checkboxGroup}>
                    <div
                        className={`${classes.check} ${checked ? classes.active : ""}`}
                        onClick={() => setChecked(!checked)}
                    ></div>
                    <div className={classes.link}>
                        {translations[lang]["card_policy"]}{" "}
                        <Link href={"/termsConditions"}>{translations[lang]["Terms"]}</Link>{" "}
                        <Link href={"/privacyPolicy"}>{translations[lang]["Privacy"]} </Link>
                        {lang === "arm" ? "և" : "and"}{" "}
                        <Link href={"/termsConditions"}>{translations[lang]["Refund Policy"]}</Link>{" "}
                    </div>
                </div>

                <button type="submit" className={classes.submitBtn}>
                    {translations[lang]["complete_payment"]}
                </button>

                <div className={classes.cards}>
                    <p>{translations[lang]["accepted_payment"]}</p>
                    <div className={classes.icons}>
                        <img src="/icons/visa.png" alt="Visa" />
                        <img src="/icons/mastercard.png" alt="MasterCard" />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Card;
