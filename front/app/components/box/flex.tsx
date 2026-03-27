import React, { FC, HTMLAttributes, ReactNode } from "react";
import styles from "./flex.module.scss";

type DivProps = HTMLAttributes<HTMLDivElement>;

interface FlexProps extends DivProps {
    children: ReactNode;
    className?: string;
    direction?: "row" | "column";
    justify?: "start" | "center" | "end" | "between" | "around";
    align?: "start" | "center" | "end" | "stretch";
}

const Flex: FC<FlexProps> = ({
    children,
    className = "",
    direction = "row",
    justify = "start",
    align = "start",
    ...rest
}) => {
    const flexClass = [
        styles.flex,
        styles[`flex-${direction}`],
        styles[`justify-${justify}`],
        styles[`align-${align}`],
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div className={flexClass} {...rest}>
            {children}
        </div>
    );
};

export default Flex;
