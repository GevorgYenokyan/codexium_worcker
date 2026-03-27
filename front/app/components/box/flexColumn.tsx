import React, { FC, HTMLAttributes, ReactNode } from "react";
import Flex from "./flex";

type DivProps = HTMLAttributes<HTMLDivElement>;

interface FlexProps extends DivProps {
    children: ReactNode;
    className?: string;
    direction?: "row" | "column";
    justify?: "start" | "center" | "end" | "between" | "around";
    align?: "start" | "center" | "end" | "stretch";
}

export const FlexColumn: FC<Omit<FlexProps, "direction">> = ({
    justify = "center",
    align = "center",
    ...props
}) => <Flex direction="column" justify={justify} align={align} {...props} />;
