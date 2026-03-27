import { FC, InputHTMLAttributes, useMemo, useState,ReactNode, RefObject } from "react";
import classes from "./input.module.scss";
import { BaseInput } from "./baseInput";
import { generateStrongPassword } from "@/app/components/methods/generateStrongPassword";
import { PASSWORD_RULES } from "@/app/config/password.rules";
import { FaEye, FaEyeSlash, FaCopy, FaDice } from "react-icons/fa";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    placeholder?: string;
    multiple?: boolean | undefined;
    // type?: string;
    variant?: "default" | "outlined" | "filled";
    Size?: "sm" | "md" | "lg";
    disabled?: boolean;
    error?: string;
    passGenerate?: boolean;
    helperText?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    ref?: RefObject<HTMLInputElement>;
}

export const Input: FC<InputProps> = ({
    label,
    variant = "default",
    Size = "md",
    error,
    helperText,
    passGenerate = false,
    className,
    ...props
}) => {
    const isPassword = props.type === "password" && passGenerate;

    const [show, setShow] = useState(false);
    const [value, setValue] = useState(String(props.value ?? ""));

    const rulesState = useMemo(() => {
        if (!isPassword) return [];
        return PASSWORD_RULES.map((r) => ({
            ...r,
            valid: r.test.test(value),
        }));
    }, [value, isPassword]);

    const isValid = !isPassword || rulesState.every((r) => r.valid);

    const classNames = [
        classes.input,
        classes[variant],
        classes[`size-${Size}`],
        (!isValid || error) && classes.error,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    const handleGenerate = () => {
        const pwd = generateStrongPassword();
        setValue(pwd);
        props.onChange?.({
            target: { value: pwd, name: props.name },
        } as any);
    };

    const handleCopy = async () => {
        if (value) {
            await navigator.clipboard.writeText(value);
        }
    };

    return (
        <div className={classes.inputWrapper}>
            {label && (
                <label className={classes.label}>
                    {label}
                    {props.required && "*"}
                </label>
            )}

            <div className={classes.inputContainer}>
                <BaseInput
                    {...props}
                    type={isPassword && show ? "text" : props.type}
                    value={value}
                    className={classNames}
                    onChange={(e) => {
                        setValue(e.target.value);
                        props.onChange?.(e);
                    }}
                />

                {isPassword && (
                    <>
                        <span className={classes.iconRight} style={{ right: 10 }}>
                            {show ? (
                                <FaEyeSlash onClick={() => setShow(false)} />
                            ) : (
                                <FaEye onClick={() => setShow(true)} />
                            )}
                        </span>

                        <span className={classes.iconRight} style={{ right: 45 }}>
                            <FaDice onClick={handleGenerate} />
                        </span>

                        {value && (
                            <span className={classes.iconRight} style={{ right: 80 }}>
                                <FaCopy onClick={handleCopy} />
                            </span>
                        )}
                    </>
                )}
            </div>

            {!error && isPassword && (
                <ul className={classes.helperText}>
                    {rulesState.map((r) => (
                        <li key={r.label} style={{ color: r.valid ? "#4bb749" : "#aaa" }}>
                            {r.valid ? "✔" : "○"} {r.label}
                        </li>
                    ))}
                </ul>
            )}

            {error && <p className={classes.errorText}>{error}</p>}
            {!error && helperText && <p className={classes.helperText}>{helperText}</p>}
        </div>
    );
};

Input.displayName = "Input";

// import classes from "./input.module.scss";
// import { FC, InputHTMLAttributes, ReactNode, RefObject } from "react";
// import { BaseInput } from "./baseInput";
// import { generateStrongPassword } from "@/app/components/methods/generateStrongPassword";

// interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
//     label?: string;
//     placeholder?: string;
//     multiple?: boolean | undefined;
//     // type?: string;
//     variant?: "default" | "outlined" | "filled";
//     Size?: "sm" | "md" | "lg";
//     disabled?: boolean;
//     error?: string;
//     passGenerate?: boolean;
//     helperText?: string;
//     leftIcon?: ReactNode;
//     rightIcon?: ReactNode;
//     ref?: RefObject<HTMLInputElement>;
// }

// export const Input: FC<InputProps> = ({
//     label,
//     placeholder,
//     // type = "text",
//     variant = "default",
//     Size = "md",
//     disabled,
//     error,
//     helperText,
//     passGenerate = false,
//     leftIcon,
//     rightIcon,
//     ref,
//     className,
//     ...props
// }) => {
//     const classNames = [
//         classes.input,
//         classes[variant],
//         classes[`size-${Size}`],
//         className,
//         error ? classes.error : "",
//         disabled ? classes.disabled : "",
//     ]
//         .filter(Boolean)
//         .join(" ");

//     return (
//         <div className={classes.inputWrapper}>
//             {label && (
//                 <label className={classes.label}>
//                     {label}
//                     {props.required ? `*` : ""}
//                 </label>
//             )}
//             <div className={classes.inputContainer}>
//                 {leftIcon && <span className={classes.iconLeft}>{leftIcon}</span>}
//                 <BaseInput
//                     ref={ref}
//                     className={classNames}
//                     // type={type}
//                     placeholder={placeholder}
//                     disabled={disabled}
//                     {...props}
//                 />
//                 {rightIcon && <span className={classes.iconRight}>{rightIcon}</span>}
//             </div>
//             {error ? (
//                 <p className={classes.errorText}>{error}</p>
//             ) : (
//                 helperText && <p className={classes.helperText}>{helperText}</p>
//             )}
//         </div>
//     );
// };

// Input.displayName = "Input";
