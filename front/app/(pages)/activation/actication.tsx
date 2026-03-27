"use client";
import { useActivateMutation } from "@/app/redux/features/api/codexiumApi";
import classes from "./page.module.scss";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { FC, useEffect, useState } from "react";
import ConfirmModal from "@/app/components/confirmModal/confirmModal";

const AlertBox = dynamic(() => import("@/app/components/alertBox/alertBox"), { ssr: false });

const Activation: FC = () => {
    const [activation, { isError, isLoading, isSuccess, error }] = useActivateMutation();
    const [message, setMessage] = useState<string>("");
    const [isVisible, setIsVisible] = useState(false);
    const params = useSearchParams();
    const router = useRouter();
    const code = params.get("code");
    const handleClose = () => setIsVisible(false);
    const handleSuccess = () => console.log("Success action triggered");
    useEffect(() => {
        if (code) {
            activation({ link: code });
        }
    }, [code, activation]);

    useEffect(() => {
        if (isSuccess) {
            setIsVisible(true);
            setTimeout(() => router.push("/profile"), 3000);
        } else if (isError) {
            setMessage((error as any)?.data?.message || "An unexpected error occurred.");
        }
    }, [isSuccess, isError, error, router]);

    return (
        <div className={classes.container}>
            <Image
                src="/icons/right.svg"
                width={200}
                height={320}
                alt="arrow"
                className={classes["left"]}
                priority
            />
            {/* {
                <AlertBox
                    type={"success"}
                    title="You’re now all set!"
                    message="Your account has been created successfully."
                    text="Let’s Start"
                    isVisible={true}
                    onClose={handleClose}
                    duration={3000}
                    position="center"
                    onSuccess={handleSuccess}
                />
            } */}
            <ConfirmModal
                isOpen={isVisible}
                text="Let’s Start"
                onClose={() => {
                    setIsVisible(true);
                }}
                message="You’re now all set!"
                description="Your account has been created successfully."
                onConfirm={() => {
                    router.push("/login");
                }}
            />
        </div>
    );
};

export default Activation;
