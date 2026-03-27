"use client";

import React, { useState, useEffect } from "react";
import PhoneInputBase, { isValidPhoneNumber } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import "./phoneInput.scss";
import { useAppSelector } from "@/app/redux/reduxHuks";

export type PhoneInputProps = {
    value?: string;
    onChange?: (value?: string) => void;
    name?: string;
    placeholder?: string;
    required?: boolean;
    id?: string;
    autoFocus?: boolean;
    label?: string;
};

export default function PhoneInput({
    value: propValue,
    onChange,
    name,
    label = "",
    placeholder = "+1 (555) 555-5555",
    required = false,
    id,
    autoFocus = false,
}: PhoneInputProps) {
    const [value, setValue] = useState<string | undefined>(propValue);
    const [touched, setTouched] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const lang = useAppSelector((state) => state.translation.leng);

    useEffect(() => {
        setValue(propValue);
    }, [propValue]);

    useEffect(() => {
        if (!value) {
            setIsValid(required ? false : null);
            return;
        }
        try {
            setIsValid(isValidPhoneNumber(value));
        } catch {
            setIsValid(false);
        }
    }, [value, required]);

    function handleChange(next: string | undefined) {
        setValue(next);
        if (!touched) setTouched(true);
        onChange?.(next);
    }

    return (
        <div className={"phone_section"}>
            <label htmlFor={id} className={"label"}>
                {label?.length > 0 ? label : lang === "arm" ? "հեռախոսահամար" : "phone number"}
                {required && <span className={"required"}> *</span>}
            </label>

            <div style={{ position: "relative" }}>
                <PhoneInputBase
                    id={id}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    international
                    flags={flags}
                    focusInputOnCountrySelection
                    // countryCallingCodeEditable={false}
                    autoComplete="tel"
                    aria-invalid={isValid === false}
                    autoFocus={autoFocus}
                    className={`${"phone_input"} ${isValid === false ? "invalid" : ""}`}
                />

                <div className={"status" + " " + (isValid ? "valid" : "invalidStatus")}>
                    {isValid === true && " valid"}
                    {isValid === false && " invalid"}
                </div>
            </div>

            {/* <p className={""}>
                Automatic formats are offered by the foreign code. Powered by inter-dunarods номера.
            </p> */}

            {touched && isValid === false && (
                <h5 className={"error"}>
                    {lang === "arm"
                        ? "Մուտքագրեք վավեր հեռախոսահամար։"
                        : "Please enter a valid phone number."}
                </h5>
            )}
        </div>
    );
}
