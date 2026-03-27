"use client";
import React, { ChangeEvent, FC, useCallback, useEffect, useState } from "react";
import PhoneInput from "@/app/components/phoneInput/phoneInput";
import Form from "@/app/modules/form/form";
import { Input } from "@/app/shared/ui/inputs/input";
import classes from "../style/form.module.scss";
import { useAppSelector } from "@/app/redux/reduxHuks";
import { translations } from "@/app/redux/features/translations/initialtranslations";
import NfcCard from "./nfcCard";
import UploadModule from "@/app/modules/upload/uploadModule";
import FileList from "./addFileList";
import SmallCard from "./smallCard";
import { useGetUserByIdQuery, useNfcOrderMutation } from "@/app/redux/features/api/codexiumApi";
import { Message } from "@/app/types/types";
import ConfirmModal from "@/app/components/confirmModal/confirmModal";

interface Urls {
    id: string | number;
    src: string;
}

const NfcForm: FC = () => {
    const [type, setType] = useState<"individual" | "company">("individual");
    const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
    const [logo, setLogo] = useState<File | null>(null);
    const [color, setColor] = useState("#000000");
    const [font, setFont] = useState("Classic");
    const [phone, setPone] = useState<string | undefined>("");
    const [whatsapp, setWhatsapp] = useState<string | undefined>("");
    const [urls, setUrls] = useState<Urls[]>([]);
    const [imageUrl, setImageUrl] = useState<Urls[]>([]);
    const [message, setMessage] = useState<Message>({ text: "" });
    const [isOpen, setIsOpen] = useState(false);

    const [image, setImage] = useState<File[]>([]);

    const { data } = useGetUserByIdQuery({});

    const [addNfc, { isLoading, isSuccess, isError, error }] = useNfcOrderMutation();

    const [values, setValues] = useState({
        path: "",
        name: "",
        company_name: "",
        type: "",
        profession: "",
        description: "",
        companies: "",
        website: "",
        phone: "",
        facebook: "",
        linkedin: "",
        position: "",
        instagram: "",
        behance: "",
        viber: "",
        telegram: "",
        email: "",
        links: "",
        font: "",
    });

    const handleSocialChange = (index: number, value: string) => {
        const updated = [...socialLinks];
        updated[index].url = value;
        setSocialLinks(updated);
    };

    const addSocialLink = () => {
        setSocialLinks([...socialLinks, { platform: "", url: "" }]);
    };

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        setValues({
            ...values,
            [e.target.name]: e.target.value,
        });
    };

    const lang = useAppSelector((state) => state.translation.leng);

    const errorCallback = useCallback((msg: string) => {
        setMessage({ text: msg });
    }, []);

    const closeErrorMessage = useCallback(() => {
        setMessage({ text: "" });
    }, []);

    const getErrors = useCallback((): Record<any, any> => {
        return error ? (error as Record<any, any>) : {};
    }, [error]);

    const submit = (formValues: Record<string, any>) => {
        const formData = new FormData();
        Object.entries(formValues).forEach(([key, value]) => formData.append(key, value));
        if (data) {
            formData.append("userId", data?.id);
        }
        image.forEach((file) => formData.append("image", file));

        addNfc(formData);
    };

    useEffect(() => {
        if (isSuccess) {
            setIsOpen(true);
        }
    }, [isSuccess, isError]);

    return (
        <div className={classes.container}>
            <div className={classes.inputs_side}>
                <div className={classes.select_type}>
                    <h2>{translations[lang]["SelectCard"]}</h2>

                    <p>{translations[lang]["please_choose"]}</p>
                </div>
                <div className={classes.radioGroup}>
                    <label>
                        <input
                            type="radio"
                            name="type"
                            checked={type === "individual"}
                            onChange={() => setType("individual")}
                        />
                        {translations[lang]["Individual"]}
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="type"
                            checked={type === "company"}
                            onChange={() => setType("company")}
                        />
                        {translations[lang]["Company"]}
                    </label>
                </div>

                <Form className={classes.main_form} fields={[]} onSubmit={(e) => {}}>
                    <h3>{translations[lang]["Basic Information"]}</h3>
                    <Input
                        value={values.path}
                        name={`path`}
                        label={`Path`}
                        placeholder={""}
                        onChange={handleChange}
                        className={classes.form_input}
                        required
                    />
                    <Input
                        value={type === "company" ? values.company_name : values.name}
                        name={type === "individual" ? "name" : "company_name"}
                        label={
                            type === "individual"
                                ? translations[lang]["name"]
                                : translations[lang]["company_name"]
                        }
                        placeholder={
                            type === "individual"
                                ? translations[lang]["name"]
                                : translations[lang]["company_name"]
                        }
                        className={classes.form_input}
                        onChange={handleChange}
                        required
                    />
                    <div className={classes.bio_container}>
                        <label className={classes.bio}>
                            {type === "individual"
                                ? translations[lang]["Short Bio"]
                                : translations[lang]["Company Overview"]}
                        </label>
                        <textarea
                            value={values.description}
                            name="description"
                            onChange={handleChange}
                            id={classes.bio}
                            placeholder="Short description ..."
                            className={classes.form_input}
                        ></textarea>
                    </div>
                    <Input
                        value={values.description}
                        name="description"
                        onChange={handleChange}
                        label={type === "individual" ? "Short Bio" : "Company Overview"}
                        placeholder="Short description ..."
                        className={classes.form_input}
                    />
                    <Input
                        value={values.website}
                        name="website"
                        onChange={handleChange}
                        label={translations[lang]["Website URL"]}
                        placeholder="http://www.example.com"
                        className={classes.form_input}
                    />
                    <PhoneInput value={phone} onChange={setPone} />

                    <PhoneInput value={whatsapp} onChange={setWhatsapp} label={"whatsapp"} />

                    <Input
                        value={values.telegram}
                        name="telegram"
                        onChange={handleChange}
                        label="Telegram"
                        placeholder="imNikName"
                        className={classes.form_input}
                    />

                    {type === "company" && (
                        <>
                            <Input
                                value={values.name}
                                name="name"
                                onChange={handleChange}
                                label=" Name"
                                placeholder="Full name"
                                className={classes.form_input}
                            />
                            <Input
                                value={values.position}
                                name="position"
                                onChange={handleChange}
                                label="Job Title"
                                placeholder="e.g. CEO"
                                className={classes.form_input}
                            />
                        </>
                    )}

                    <h4>Social Media Links</h4>
                    <Input
                        value={values.facebook}
                        name="facebook"
                        onChange={handleChange}
                        label="Facebook URL"
                        placeholder="https://facebook.com/username"
                        className={classes.form_input}
                    />
                    <Input
                        value={values.linkedin}
                        name="linkedin"
                        onChange={handleChange}
                        label="LinkedIn URL"
                        placeholder="https://linkedin.com/in/username"
                        className={classes.form_input}
                    />
                    <Input
                        value={values.instagram}
                        name="instagram"
                        onChange={handleChange}
                        label="Instagram URL"
                        placeholder="https://instagram.com/username"
                        className={classes.form_input}
                    />
                    <Input
                        value={values.email}
                        name="email"
                        onChange={handleChange}
                        label={translations[lang]["Email"]}
                        placeholder="example@mail.com"
                        className={classes.form_input}
                    />

                    {socialLinks.map((link, index) => (
                        <Input
                            key={index + 4}
                            name={`social_${index + 4}`}
                            label={link.platform || `Custom Link ${index + 1}`}
                            placeholder="https://..."
                            value={link.url}
                            onChange={(e) => handleSocialChange(index + 4, e.target.value)}
                            className={classes.form_input}
                        />
                    ))}

                    {/* <button type="button" onClick={addSocialLink}>
                        + More links
                    </button> */}

                    {imageUrl.length == 0 && (
                        <UploadModule
                            maxFileSize={5 * 1024 * 1024}
                            allowedMimeTypes={[
                                "image/jpeg",
                                "image/png",
                                "application/pdf",
                                "image/webp",
                            ]}
                            setFiles={setImage}
                            files={image}
                            urls={urls}
                            list={false}
                            setUrls={setImageUrl}
                        />
                    )}

                    <FileList
                        files={image}
                        urls={imageUrl}
                        setFiles={setImage}
                        setUrls={setImageUrl}
                    />

                    <h4>{translations[lang]["Design Options"]}</h4>
                    <div className={classes.colors}>
                        {["#000000", "#4BB749", "#FFFFFF", "#0040FF", "#A06AFF"].map((el) => (
                            <div
                                key={el}
                                className={classes.colorBox}
                                style={{ backgroundColor: el, width: 100, height: 50 }}
                                onClick={() => setColor(el)}
                            />
                        ))}
                        <input
                            type="color"
                            name="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                        />
                    </div>
                    <h3>{translations[lang]["font style"]}</h3>
                    <div className={classes.designOptions}>
                        {[
                            { id: 1, title: "modern", desc: "Company Name" },
                            { id: 2, title: "modern", desc: "Company Name" },
                            { id: 3, title: "modern", desc: "Company Name" },
                            { id: 4, title: "modern", desc: "Company Name" },
                        ].map((el) => {
                            return (
                                <div
                                    className={classes.designItem}
                                    key={el.id}
                                    onClick={() => setFont(el.title)}
                                >
                                    <h3>{el.title}</h3>
                                    <p>{el.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </Form>
            </div>
            <div className={classes.preview}>
                <SmallCard name={values.name} position={values.profession} />
                <NfcCard data={{ ...values, color, font, phone, image: imageUrl[0]?.src }} />
                <button
                    onClick={() => {
                        submit({ ...values, color, phone, font, whatsapp });
                    }}
                    type="submit"
                >
                    Generate NFC Business Card
                </button>
            </div>
            <ConfirmModal
                isOpen={isOpen}
                onClose={() => {
                    setIsOpen(false);
                }}
                message="your order has been successfully placed"
                onConfirm={() => {
                    setIsOpen(false);
                }}
                text="register"
                description="Our team will contact you soon to clarify the details"
            />
        </div>
    );
};

export default NfcForm;
