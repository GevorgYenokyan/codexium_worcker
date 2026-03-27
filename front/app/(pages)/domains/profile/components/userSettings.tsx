"use client";
import classes from "../style/userSettings.module.scss";
import React, { FC, useCallback, useEffect, useRef, useState, forwardRef } from "react";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { Message, User } from "@/app/types/types";
import { useUpdateUserMutation } from "@/app/redux/features/api/codexiumApi";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import ErrorMessage from "@/app/components/errorMessage/errorMessage";
import { generateData } from "./data";
import Form from "@/app/modules/form/form";
import PhoneInput from "@/app/components/phoneInput/phoneInput";
import Link from "next/link";
import ConfirmModal from "@/app/components/confirmModal/confirmModal";
import { useGetUserByIdQuery } from "@/app/redux/features/api/nameApi";

const UserSettings: FC = () => {
    const { data } = useGetUserByIdQuery({});
    const lang = useAppSelector((state) => state.translation.leng);
    const [update, { isError, isSuccess, error, isLoading }] = useUpdateUserMutation();
    const [isVisible, setIsVisible] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [phone, setPhone] = useState<string | undefined>();
    const [message, setMessage] = useState<Message>({
        text: "",
    });

    const formRef = useRef<{
        setFields: (
            newValues: Partial<{
                name: string;
                email: string;
            }>
        ) => void;
        resetFields: () => void;
    }>(null);


    const handleSetFields = () => {
        const { name, email } = data;
        formRef?.current?.setFields({
            name,
            email,
        });
    };

    useEffect(() => {
        if (isSuccess) {
            setIsVisible(true);
        }
    }, [isSuccess, isError]);

    const submit = (formValues: Record<string, string>) => {
        if (phone) {
            formValues.phone = phone;
        }
        update(formValues);
    };
    useEffect(() => {
        if (data && formRef.current) {
            const { name, email } = data;
            formRef.current.setFields({ name, email });
            setPhone(data.phone);
        }
    }, [data]);

    return (
        <div className={classes.container}>
            <Form
                fields={generateData(translations, lang)}
                onSubmit={submit}
                ref={formRef}
                className={classes.form}
                inputClassName={classes.inputs}
                onchange={() => {
                    setIsActive(true);
                }}
            >
                <PhoneInput
                    value={phone}
                    onChange={(value) => {
                        setPhone(value);
                        setIsActive(true);
                    }}
                />

                <Link className={classes.form_link} href={"/forgotPassword"}>
                    {translations[lang]["Change password"]}
                </Link>
                <Link className={classes.form_link} href={"/"}>
                    {translations[lang]["delete_account"]}
                </Link>
                <ErrorMessage message={message} />

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`${classes.send_btn} ${isActive && classes.active}`}
                >
                    {translations[lang]["Save changes"]}
                </button>
            </Form>

            <ConfirmModal
                isOpen={isVisible}
                onClose={() => setIsVisible(false)}
                onConfirm={() => setIsVisible(false)}
                text={translations[lang]["close"]}
                message={"personal data changes"}
            />
        </div>
    );
};

export default UserSettings;
