import classes from "../style/index.module.scss";
import React from "react";
import RegistrationForm from "./form";

const Index = () => {
    return (
        <div className={classes["container"]}>
            <RegistrationForm />
        </div>
    );
};

export default Index;
