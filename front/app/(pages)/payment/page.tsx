import React from "react";
import classes from "./page.module.scss";
import Main from "./components/main";

const Page = () => {
    return (
        <div className={classes.container}>
            <Main />
        </div>
    );
};

export default Page;
