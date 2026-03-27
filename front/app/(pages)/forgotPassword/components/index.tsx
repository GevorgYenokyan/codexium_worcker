import classes from "../style/index.module.scss";
import React from "react";
import forgotPasswordForm from "./forgotPasswordForm";
import ForgotPasswordForm from "./forgotPasswordForm";

const Index = () => {
    return (
        <div className={classes["container"]}>
            <ForgotPasswordForm />
        </div>
    );
};

export default Index;
