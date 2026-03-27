"use client";

import { FC, ReactNode } from "react";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import classes from "./customLink.module.scss";

interface CustomLinkProps extends LinkProps {
    children: ReactNode;
    className?: string;
    activeClassName?: string;
    exact?: boolean;
}

const CustomLink: FC<CustomLinkProps> = ({
    children,
    className = "",
    activeClassName = classes.active,
    exact = false,
    ...props
}) => {
    const pathname = usePathname();

    const isActive = exact ? pathname === props.href : pathname?.startsWith(props.href.toString());

    return (
        <Link {...props} className={`${"link"} ${className} ${isActive ? activeClassName : ""}`}>
            {children}
        </Link>
    );
};

export default CustomLink;
