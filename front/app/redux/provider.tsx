"use client";
import { Provider } from "react-redux";
import { ReactNode, FC } from "react";
import { store } from "./store";
interface Props {
    children: ReactNode;
}

const Providers: FC<Props> = ({ children }) => {
    return <Provider store={store}>{children}</Provider>;
};

export default Providers;
