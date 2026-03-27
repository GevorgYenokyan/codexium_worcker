"use client";

import { FC, useState, useEffect } from "react";
import { User } from "@/app/types/types";
import styles from "./userCard.module.scss";
import { FaViber, FaTelegram, FaWhatsapp, FaGlobe, FaCopy } from "react-icons/fa";
import CustomImage from "@/app/shared/ui/img/customImage";
import Link from "next/link";

interface Props {
    data: User;
}

const UserCard: FC<Props> = ({ data }) => {
    const [isMounted, setIsMounted] = useState(false);
    const [copiedField, setCopiedField] = useState<"email" | "phone" | null>(null);

    useEffect(() => {
        setIsMounted(true);
        if (copiedField) {
            const timer = setTimeout(() => setCopiedField(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [copiedField]);

    const {
        name,
        email,
        phone,
        viber,
        telegram,
        whatsapp,
        website,
        images,
        profession,
        rating,
        id,
    } = data;

    const imageUrl = images?.length ? `/${images[0]?.image}` : "/default-user.png";

    const copyToClipboard = (text: string, field: "email" | "phone") => {
        try {
            navigator.clipboard.writeText(text).then(() => {
                setCopiedField(field);
            });
        } catch (error) {
            console.error(`Failed to copy ${field}`);
        }
    };

    const socialLinks = [
        {
            platform: "Viber",
            value: viber,
            href: `viber://chat?number=${viber}`,
            icon: <FaViber />,
        },
        {
            platform: "Telegram",
            value: telegram,
            href: `https://t.me/${telegram?.replace("+", "")}`,
            icon: <FaTelegram />,
        },
        {
            platform: "WhatsApp",
            value: whatsapp,
            href: `https://wa.me/${whatsapp?.replace("+", "")}`,
            icon: <FaWhatsapp />,
        },
        { platform: "Website", value: website, href: website, icon: <FaGlobe /> },
    ].filter((link) => link.value);

    // Normalize rating to 1–5 stars, default to 1 if invalid
    const normalizedRating = rating ? Math.max(1, Math.min(5, Math.round(rating))) : 1;

    if (!isMounted) return null;

    return (
        <Link
            href={`specialists/${id}`}
            className={styles.container}
            role="article"
            aria-labelledby={`user-${data.id}-name`}
        >
            <div className={styles.imageWrapper}>
                <CustomImage
                    src={imageUrl}
                    alt={`${name}'s profile picture`}
                    width={120}
                    height={120}
                    className={styles.profileImage}
                    priority
                    sizes="(max-width: 600px) 100vw, 120px"
                />
            </div>

            <h2 id={`user-${data.id}-name`} className={styles.name}>
                {name}
            </h2>
            {profession && <div className={styles.profession}>{profession}</div>}
            <div className={styles.email}>
                <span>{email}</span>
                <button
                    onClick={() => copyToClipboard(email, "email")}
                    className={styles.copyButton}
                    aria-label={`Copy ${name}'s email`}
                    title="Copy email"
                >
                    <FaCopy />
                    {copiedField === "email" && (
                        <span className={styles.copiedTooltip}>Copied!</span>
                    )}
                </button>
            </div>
            {phone && (
                <div className={styles.phone}>
                    <span>{phone}</span>
                    <button
                        onClick={() => copyToClipboard(phone, "phone")}
                        className={styles.copyButton}
                        aria-label={`Copy ${name}'s phone number`}
                        title="Copy phone"
                    >
                        <FaCopy />
                        {copiedField === "phone" && (
                            <span className={styles.copiedTooltip}>Copied!</span>
                        )}
                    </button>
                </div>
            )}
            <div className={styles.rating}>
                {"★".repeat(normalizedRating)} {"☆".repeat(5 - normalizedRating)}
            </div>
            <div className={styles.links}>
                {socialLinks.map((link, index) => (
                    <a
                        key={index}
                        // href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.socialLink}
                        aria-label={`Contact ${name} on ${link.platform}`}
                        title={link.platform}
                    >
                        {link.icon}
                    </a>
                ))}
            </div>
        </Link>
    );
};

export default UserCard;
