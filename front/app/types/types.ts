import { ButtonHTMLAttributes, ReactNode, RefObject } from "react";

export interface Option {
    id?: number | string;
    code: string;
    label?: string;
    src?: string;
}

export interface Message {
    text: string;
    type?: boolean;
}

export type PasswordStrength = "weak" | "medium" | "strong";
export interface InputProps {
    label: string;
    name: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    variant?: "default" | "outlined" | "filled";
    Size?: "sm" | "md" | "lg";
    min?: number;
    max?: number;
    className?: string;
    pattern?: string;
    value?: string;
    error?: string;
    rightIcon?: ReactNode;
    disabled?: boolean;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    onClick?: () => void;
    ref?: RefObject<HTMLButtonElement>;
    children: ReactNode;
    icon?: ReactNode;
    loading?: boolean;
}

export interface CarouselProps {
    children: React.ReactNode[];
    slidesToShow?: number;
    autoplay?: boolean;
    autoplaySpeed?: number;
    infinite?: boolean;
}

export interface Nfc {
    id: number;
    userId: number;
    path: string;
    name: string;
    company_name: string;
    position: string;
    type: string;
    profession: string;
    description: string;
    companies: string;
    website: string;
    representative_name: null;
    representative_role: null;
    phone: string;
    viber: string;
    telegram: string;
    whatsapp: string;
    facebook: string;
    linkedin: string;
    instagram: string;
    behance: string;
    email: string;
    links: string;
    color: string;
    font: string;
    status: string;
    price: string;
    nfcType: string;
    image: string;
    logo: null;
}

export interface User {
    id: number;
    email: string;
    user_type: string;
    name: string;
    profession: string;
    location: null;
    phone_number: null;
    work_experience: null;
    age: null;
    rating: number;
    company_name: null;
    business_type: null;
    phone: string;
    viber: string;
    telegram: string;
    whatsapp: string;
    website: null;
    images: {
        id: number;
        userId: number;
        image: string;
    }[];
    portfolio: {
        id: number;
        userId: number;
        title: string;
        description: string;
        lang: string;
        index: null;
        createdAt: string;
        updatedAt: string;
    }[];
    nfc: Nfc[];
}

export interface Urls {
    id: string | number;
    src: string;
}

export interface Announcements {
    id: number;
    userId: number;
    title: string;
    lang: null;
    pricing: string;
    description: string;
    contact_information: null;
    location: null;
    verify: boolean;
    likeCount: number;
    createdAt: string;
    updatedAt: string;
    images: {
        id: number;
        announcementId: number;
        userId: number;
        imagePath: string;
    }[];
    user: {
        name: string;
        profession: string;
        rating: string;
    };
}

export interface Like {
    id: number;
    announcementId: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
}

export interface Transaction {
    id: number;
    simpleUserId: number;
    specialistId: number;
    description: string;
    amount: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    simpleUser: {
        name: string;
        profession: null;
        rating: number;
    };
    specialist: {
        name: string;
        profession: string;
        rating: number;
    };
}

export interface Portfolio {
    id: number;
    title: string;
    title_eng: string;
    description: string;
    description_eng: string;
    project_name: string;
    project_name_eng: string;
    client: string;
    client_eng: string;
    technologies: string;
    Website_link: string;
    createdAt: string;
    updatedAt: string;
    images: {
        id: number;
        portfolioId: number;
        imagePath: string;
        createdAt: string;
        updatedAt: string;
    }[];
}
