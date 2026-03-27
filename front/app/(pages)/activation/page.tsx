"use client";

import { FC, Suspense } from "react";
import Activation from "./actication";

const ActivationPage: FC = () => {
    return (
        <Suspense>
            <Activation />
        </Suspense>
    );
};

export default ActivationPage;
