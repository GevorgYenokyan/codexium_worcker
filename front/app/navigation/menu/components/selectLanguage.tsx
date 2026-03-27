"use client";
import { FC, useEffect, useState } from "react";
import classes from "../style/selectLanguage.module.scss";
import { useAppDispatch, useAppSelector } from "@/app/redux/reduxHuks";
import { setTranslation } from "@/app/redux/features/translations/translationsSlice";
import useQueryParams from "@/app/hooks/useQueryParams";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { setCookie } from "cookies-next";
import { FaChevronDown } from "react-icons/fa6";

type Leng = "arm" | "eng";

interface lengType {
    leng: string;
    val: Leng;
}

let languages: lengType[] = [
    {
        leng: "Հայ",
        val: "arm",
    },
    {
        leng: "Eng",
        val: "eng",
    },
];

let names = {
    arm: "Հայ",
    eng: "ENG",
};

const langsArr = ["arm", "eng"];

const SelectLanguage: FC = () => {
    const leng = useAppSelector((state) => state.translation.leng);
    const dispatch = useAppDispatch();
    const { updateQueryParam } = useQueryParams();
    const params = useSearchParams();
    const paramsId = (params.get("lang") as Leng) || ("eng" as Leng);
    const router = useRouter();
    const path = usePathname();

    const paramsLang = path.split("/").filter(Boolean);

    const selectLang = (lang: string) => {
        const segments = path.split("/").filter(Boolean);
        if (segments.length > 0) {
            segments[0] = lang;
        } else {
            segments.push(lang);
        }
        const newPath = "/" + segments.join("/");
        router.push(newPath);
    };

    const leng_buttons = languages.map((el, i) => {
        return (
            <div
                className={classes["leng_btn"]}
                onClick={() => {
                    dispatch(setTranslation(el.val));
                    if (!langsArr.includes(paramsLang[0])) {
                        updateQueryParam("lang", el.val);
                    }
                    setCookie("lang", el.val);
                    if (langsArr.includes(paramsLang[0])) {
                        selectLang(el.val);
                    }
                }}
                key={i}
            >
                {el.leng}
            </div>
        );
    });

    useEffect(() => {
        dispatch(setTranslation(paramsId || leng));
        if (langsArr.includes(paramsLang[0])) {
            updateQueryParam("lang", paramsId || leng);
        }
        setCookie("lang", paramsId || leng);
    }, []);

    useEffect(() => {
        if (langsArr.includes(paramsLang[0])) {
            selectLang(leng);
        }
    }, [params]);

    return (
        <div className={classes["leng_container"]}>
            <div className={classes["btn_container"]}>
                <button className={classes["select_leng"]}>
                    {names[leng]}
                    <FaChevronDown className={classes["arrowDown"]} />
                </button>
                <div className={classes["btn_list"]}>{leng_buttons}</div>
            </div>
        </div>
    );
};

export default SelectLanguage;
