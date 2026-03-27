import React, { FC, HTMLAttributes, ReactNode } from "react";
import Flex from "./flex";

// Extend HTML div attributes for compatibility
type DivProps = HTMLAttributes<HTMLDivElement>;

// Define strict prop types
interface FlexProps extends DivProps {
    children: ReactNode;
    className?: string;
    direction?: "row" | "column";
    justify?: "start" | "center" | "end" | "between" | "around";
    align?: "start" | "center" | "end" | "stretch";
}

export const FlexRow: FC<FlexProps> = ({ justify = "center", align = "center", ...props }) => (
    <Flex justify={justify} align={align} {...props} />
);
