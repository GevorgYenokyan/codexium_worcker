import { FC, useCallback, useEffect, useMemo, useState } from "react";
import classes from "../style/form.module.scss";
import Form from "@/app/modules/form/form";
import { useLoginMutation, useRecoverPasswordMutation } from "@/app/redux/features/api/codexiumApi";
import { generateData } from "./data";
import { Message } from "@/app/types/types";
import { ReactTyped } from "react-typed";
import { useRouter, useSearchParams } from "next/navigation";
import { setCookie } from "cookies-next";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useAppSelector } from "@/app/redux/reduxHuks";
import {
    btnTranslations,
    translations,
} from "@/app/redux/features/translations/initialtranslations";
import AlertBox from "@/app/components/alertBox/alertBox";
import ErrorMessage from "@/app/components/errorMessage/errorMessage";

const RecoverPassword: FC = () => {
    const [recover, { data = {}, isLoading, isSuccess, isError, error }] =
        useRecoverPasswordMutation();
    const link = useSearchParams().get("code");
    const [showPassword, setShowPassword] = useState(false);
    const lang = useAppSelector((state) => state.translation.leng);

    const router = useRouter();
    const [message, setMessage] = useState<Message>({
        text: "",
    });

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
            router.push("/login");
            setCookie("JWT", data?.token);
        } else if (isError && getErrors()?.data?.message) {
            errorCallback(getErrors().data.message);
        }
    }, [isSuccess, isError, getErrors, errorCallback]);

    const submit = (formValues: Record<string, string>) => {
        recover({
            link,
            password: formValues?.password,
        });
    };

    const userData = useMemo(() => {
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
    }, [showPassword, lang]);

    return (
        <div className={classes["container"]}>
            <div className={classes.text_side}>
                <div className={classes.line_container}>
                    <div className={classes.line}></div>
                    <h3 className={`${lang === "arm" ? classes["h3Arm"] : ""}`}>
                                <ReactTyped
                                  strings={[`${translations[lang]["register_text"]}`]}
                                  typeSpeed={40}
                                  className={classes.line1}
                                  showCursor={true}
                                />
                              </h3>
                </div>
            </div>

            <div className={classes.formSide}>
                <div className={classes.form_container}>
                    <h3>{translations[lang]["Create a New Password"]}</h3>
                    <Form
                        fields={userData}
                        onSubmit={submit}
                        onchange={closeErrorMessage}
                        className={classes.form}
                        inputClassName={classes.inputs}
                    >
                        <ErrorMessage message={message} />
                        <button type="submit">{btnTranslations[lang]["Signin"]}</button>
                    </Form>
                </div>
            </div>
            {isSuccess ? (
                <AlertBox
                    type={"success"}
                    message={message.text}
                    isVisible={isSuccess}
                    onClose={() => {}}
                    duration={3000}
                    position="center"
                />
            ) : isError ? (
                <AlertBox
                    type={""}
                    message={message.text}
                    isVisible={isError}
                    onClose={() => {}}
                    duration={3000}
                    position="center"
                />
            ) : null}
        </div>
    );
};

export default RecoverPassword;
