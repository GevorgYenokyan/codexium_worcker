"use client";

import classes from "../style/form.module.scss";
import { FC, useEffect, useState, useMemo, useCallback } from "react";
import Form from "@/app/modules/form/form";
import { userTypes, generateData } from "./data";
import { Message } from "@/app/types/types";
import { useRouter } from "next/navigation";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

import WindowModal from "@/app/components/modal/modal";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import { FlexRow } from "@/app/components/box/flexRow";
import ErrorMessage from "@/app/components/errorMessage/errorMessage";
import Link from "next/link";
import Image from "next/image";
import ConfirmModal from "@/app/components/confirmModal/confirmModal";
import { useRegistrationMutation } from "@/app/redux/features/api/nameApi";
interface Urls {
    id: string | number;
    src: string;
}
const RegistrationForm: FC = () => {
    const [signup, { data = {}, isLoading, isSuccess, isError, error }] = useRegistrationMutation();
    const router = useRouter();
    const lang = useAppSelector((state) => state.translation.leng);
    const [type, setType] = useState("simple user");
    const [showPassword, setShowPassword] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState<Message>({ text: "" });

    const togglePasswordVisibility = useCallback(() => {
        setShowPassword((prev) => !prev);
    }, []);

    const errorCallback = useCallback((msg: string) => {
        setMessage({ text: msg });
    }, []);

    const closeErrorMessage = useCallback(() => {
        setMessage({ text: "" });
    }, []);

    const getErrors = useCallback((): Record<any, any> => {
        return error ? (error as Record<any, any>) : {};
    }, [error]);

    useEffect(() => {
        if (isSuccess) {
            setShowModal(true);
        } else if (isError && getErrors()?.data?.message) {
            errorCallback(getErrors().data.message);
        }
    }, [isSuccess, isError, getErrors, errorCallback]);

    const submit = (formValues: Record<string, any>) => {
        // const formData = new FormData();
        // Object.entries(formValues).forEach(([key, value]) => formData.append(key, value));
        // formData.append("user_type", "simple user");
        // formData.append("lang", lang);
        formValues.terms = true;
        signup(formValues);
    };

    const registrationData = useMemo(() => {
        return generateData(translations, lang).map((field) => {
            if (field.name === "password") {
                return {
                    ...field,
                    type: showPassword ? "text" : "password",
                    rightIcon: showPassword ? (
                        <FaRegEyeSlash onClick={togglePasswordVisibility} />
                    ) : (
                        <FaRegEye onClick={togglePasswordVisibility} />
                    ),
                };
            }
            return field;
        });
    }, [showPassword, type, lang]);

    return (
        <FlexRow className={classes.container}>
            <div className={classes.text_side}>
                <div className={classes.line_container}>
                    <div className={classes.line}></div>
                    <h3>{translations[lang]["register_text"]}</h3>
                </div>
            </div>

            <div className={classes.formSide}>
                <div className={classes.form_container}>
                    <h3>{translations[lang]["Create an account"]}</h3>
                    <Form
                        fields={registrationData}
                        onSubmit={submit}
                        onchange={closeErrorMessage}
                        className={classes.form}
                        inputClassName={classes.inputs}
                    >
                        <Link href={"#"} className={classes.text}>
                            <div className={classes.text_container}>
                                {translations[lang]["by_creating"]}
                            </div>
                            <div className={classes.link}>
                                <span>{translations[lang]["Terms"]}</span>{" "}
                                {lang === "arm" ? "և" : "and"}{" "}
                                <span>{translations[lang]["Privacy"]} </span>
                            </div>
                        </Link>
                        <ErrorMessage message={message} />

                        <button type="submit" disabled={isLoading} className={classes.send_btn}>
                            {translations[lang]["Create an account"]}
                        </button>

                        <Link className={classes.login_link} href={"/login"}>
                            {translations[lang]["yes_account"]}{" "}
                            <span>{translations[lang]["Login"]}</span>{" "}
                        </Link>
                    </Form>
                </div>
                {/* <WindowModal isOpen={showModal} onClose={() => setShowModal(false)}>
                    <div className={classes.message}>
                        <Image src={"/icons/Send.png"} alt="img" width={120} height={120} />
                        <h2>Check Your Email</h2>
                        <p>
                            We’ve sent a confirmation link to your email. Please check your inbox
                            and confirm your email address.
                        </p>
                    </div>
                </WindowModal> */}
                <ConfirmModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onConfirm={() => setShowModal(false)}
                    text="close"
                    message={"Check Your Email"}
                    description="We’ve sent a confirmation link to your email. Please check your inbox
                            and confirm your email address."
                />
            </div>
        </FlexRow>
    );
};

export default RegistrationForm;
