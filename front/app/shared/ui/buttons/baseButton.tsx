import { ButtonHTMLAttributes, FC, RefObject } from "react";

type BaseButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

interface Props extends BaseButtonProps {
    children: React.ReactNode;
    ref?: RefObject<HTMLButtonElement>;
}

export const BaseButton: FC<Props> = ({ children, ref, ...props }) => {
    return (
        <button ref={ref} {...props}>
            {children}
        </button>
    );
};

BaseButton.displayName = "BaseButton";
