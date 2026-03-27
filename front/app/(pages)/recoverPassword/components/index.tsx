import classes from "../style/index.module.scss";
import React, { Suspense } from "react";
import LoginForm from "./recoverPassword";

const Index = () => {
    return (
        <Suspense>
            <div className={classes["container"]}>
                <LoginForm />
            </div>
        </Suspense>
    );
};

export default Index;
