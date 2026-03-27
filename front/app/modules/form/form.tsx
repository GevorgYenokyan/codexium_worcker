"use client";
import { Input } from "../../shared/ui/inputs/input";
import { InputProps } from "../../types/types";
import classes from "./form.module.scss";
import React, { ReactNode, useImperativeHandle, useState, forwardRef } from "react";

interface FormProps<T> {
    fields: InputProps[];
    onSubmit: (values: T) => void;
    onchange?: () => void;
    children?: ReactNode;
    className?: string;
    inputClassName?: string;
}

function FormInner<T extends Record<string, string>>(
    { fields, onSubmit, onchange, children, className = "", inputClassName = "" }: FormProps<T>,
    ref: React.Ref<{
        setFields: (newValues: Partial<T>) => void;
        resetFields: () => void;
    }>
) {
    const [formValues, setFormValues] = useState<T>({} as T);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const setFields = (newValues: Partial<T>) => {
        setFormValues((prev) => ({ ...prev, ...newValues }));
    };

    const resetFields = () => {
        setFormValues({} as T);
        setErrors({});
    };

    const validate = () => {
        let valid = true;
        const newErrors: Record<string, string> = {};

        fields.forEach(({ name, required, min, max, pattern, type }) => {
            const value = formValues[name]?.trim() || "";

            if (required && !value) {
                newErrors[name] = "This field is required.";
                valid = false;
            } else if (min !== undefined && value.length < min) {
                newErrors[name] = `Minimum length is ${min}.`;
                valid = false;
            } else if (max !== undefined && value.length > max) {
                newErrors[name] = `Maximum length is ${max}.`;
                valid = false;
            } else if (pattern && !new RegExp(pattern).test(value)) {
                newErrors[name] = "Invalid format.";
                valid = false;
            } else if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                newErrors[name] = "Invalid email format.";
                valid = false;
            } else if (type === "number" && isNaN(Number(value))) {
                newErrors[name] = "Must be a number.";
                valid = false;
            }
        });

        setErrors(newErrors);
        return valid;
    };

    const handleChange = (name: string, value: string) => {
        setFormValues((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formValues);
        }
    };

    useImperativeHandle(ref, () => ({
        setFields,
        resetFields,
    }));

    return (
        <form onSubmit={handleSubmit} className={className}>
            {fields?.map((field, i) => (
                <Input
                    className={inputClassName}
                    key={field.name + i}
                    {...field}
                    value={formValues[field.name] || ""}
                    error={errors[field.name]}
                    onChange={(e) => {
                        if (onchange) onchange();
                        handleChange(field.name, e.target.value);
                    }}
                />
            ))}

            {children}
        </form>
    );
}

const Form = forwardRef(FormInner) as <T extends Record<string, string>>(
    props: FormProps<T> & {
        ref?: React.Ref<{
            setFields: (newValues: Partial<T>) => void;
            resetFields: () => void;
        }>;
    }
) => JSX.Element;

export default Form;
