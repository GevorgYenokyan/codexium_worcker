"use client";
import { FC } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/app/shared/ui/buttons/button";
import { useSearchParams } from "next/navigation";
import classes from "./googleButton.module.scss";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { translations } from "@/app/redux/features/translations/initialtranslations";

const GoogleButton: FC = () => {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const lang = useAppSelector((state) => state.translation.leng);

    return (
        <Button
            className={classes.google_btn}
            style={{ color: "white" }}
            onClick={() => signIn("google", { callbackUrl })}
        >
            <img src="/icons/google.svg" alt="" />
            {translations[lang]["google_btn"]}
        </Button>
    );
};

export default GoogleButton;
