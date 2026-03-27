import classes from "../style/form.module.scss";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import Form from "@/app/modules/form/form";
import { generateData } from "./data";
import { Message } from "@/app/types/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { setCookie } from "cookies-next";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import CustomLink from "@/app/components/customLink/customLink";
import { useAppSelector } from "@/app/redux/reduxHuks";
import {
    btnTranslations,
    translations,
} from "@/app/redux/features/translations/initialtranslations";
import ErrorMessage from "@/app/components/errorMessage/errorMessage";
import Link from "next/link";
import { useLoginMutation, useUpdateUserMutation } from "@/app/redux/features/api/nameApi";

const LoginForm: FC = () => {
    const [login, { data = {}, isLoading, isSuccess, isError, error }] = useLoginMutation();
    const [showPassword, setShowPassword] = useState(false);
    const lang = useAppSelector((state) => state.translation.leng);
    const [update] = useUpdateUserMutation();

    const params = useSearchParams();
    const callback = params.get("callback");

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
            setCookie("accessToken", data?.accessToken);
            if (callback) {
                router.push(`${callback}`);
            } else {
                router.push("/profile");
            }
        } else if (isError && getErrors()?.data?.message) {
            errorCallback(getErrors().data.message);
        }
    }, [isSuccess, isError, getErrors, errorCallback]);

    const submit = (formValues: Record<string, string | boolean>) => {
        (formValues["twoFactorEnabled"] = false), (formValues["token"] = "");
        login(formValues);
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
        <div className={classes.container}>
            <div className={classes.text_side}>
                <div className={classes.line_container}>
                    <div className={classes.line}></div>
                    <h3>{translations[lang]["register_text"]}</h3>
                </div>
            </div>
            <div className={classes.formSide}>
                <div className={classes.form_container}>
                    <h3>{translations[lang]["Welcome Back!"]}</h3>
                    <Form
                        fields={userData}
                        onSubmit={submit}
                        onchange={closeErrorMessage}
                        className={classes.form}
                        inputClassName={classes.inputs}
                    >
                        <ErrorMessage message={message} />
                        <div className={classes.forgot}>
                            <Link href={"/forgotPassword"}>
                                {translations[lang]["forgot_password"]}
                            </Link>
                        </div>
                        <button type="submit" disabled={isLoading} className={classes.send_btn}>
                            {translations[lang]["Login"]}
                        </button>

                        <Link className={classes.login_link} href={"/registration"}>
                            {translations[lang]["no_account"]}{" "}
                            <span>{translations[lang]["Sign Up"]}</span>{" "}
                        </Link>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
