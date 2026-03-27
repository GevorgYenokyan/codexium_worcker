import classes from "../style/form.module.scss";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import Form from "@/app/modules/form/form";
import { generateData } from "./data";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";
import { ReactTyped } from "react-typed";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import CustomLink from "@/app/components/customLink/customLink";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import dynamic from "next/dynamic";
import ErrorMessage from "@/app/components/errorMessage/errorMessage";
import { useForgotPasswordMutation } from "@/app/redux/features/api/codexiumApi";
import { Message } from "@/app/types/types";
import Link from "next/link";

const AlertBox = dynamic(() => import("@/app/components/alertBox/alertBox"), {
  ssr: false,
});

const ForgotPasswordForm: FC = () => {
  const [send, { data = {}, isLoading, isSuccess, isError, error }] =
    useForgotPasswordMutation();
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
      // router.push("/");
      // setCookie("JWT", data?.token);
    } else if (isError && getErrors()?.data?.message) {
      errorCallback(getErrors().data.message);
    }
  }, [isSuccess, isError, getErrors, errorCallback]);

  const submit = (formValues: Record<string, string>) => {
    send(formValues);
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
          <h3>{translations[lang]["Forgot Password"]}</h3>
          <h4>{translations[lang]["Forgot text"]}</h4>
          <Form
            fields={userData}
            onSubmit={submit}
            onchange={closeErrorMessage}
            className={classes.form}
            inputClassName={classes.inputs}>
            <ErrorMessage message={message} />
            <button
              type="submit"
              disabled={isLoading}
              className={classes.send_btn}>
              {translations[lang]["Send"]}
            </button>

            <Link className={classes.login_link} href={"/registration"}>
              {translations[lang]["no_account"]}{" "}
              <span>{translations[lang]["Sign Up"]}</span>{" "}
            </Link>
          </Form>
        </div>
      </div>
      {isSuccess ? (
        <AlertBox
          type={"success"}
          message="check your opinion to recover your password!"
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

export default ForgotPasswordForm;
