import classes from "../style/index.module.scss";
import React from "react";
import LoginForm from "./loginForm";

const Index = () => {
    return (
        <div className={classes["container"]}>
            <LoginForm />
        </div>
    );
};

export default Index;
