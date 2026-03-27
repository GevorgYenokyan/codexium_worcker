"use client";

import classes from "../styles/modules.module.scss";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import { useGetAppmodulsQuery } from "@/app/redux/features/api/codexiumApi";
import { useAppSelector } from "@/app/redux/reduxHuks";

interface Module {
    id: number;
    name: string;
    name_eng: string;
    price: number;
    image: string | null;
    checked?: boolean; // Optional since it's not in the API response
}

interface Props {
    value: number;
    elements: Module[];
    setValue: Dispatch<SetStateAction<number>>;
    setElements: Dispatch<SetStateAction<Module[]>>;
    handleActive: () => void;
    range: number;
}

const Modules: FC<Props> = ({ value, setValue, setElements, handleActive, elements, range }) => {
    const { data, isError, isLoading } = useGetAppmodulsQuery({ limit: 100 });
    const [modulesData, setModulesData] = useState<Module[]>([]);
    const lang = useAppSelector((state) => state.translation.leng);

    useEffect(() => {
        if (data?.message) {
            const updatedModules = data.message.map((el: Module) => ({
                ...el,
                checked: el.price <= value,
            }));
            setModulesData(
                updatedModules.sort((a: Module, b: Module) => (a.price > b.price ? 1 : -1))
            );

            // const filterModules = data.message.filter((el: Module) => el.price <= value);
            // setElements(filterModules);
        }
    }, [data]);

    useEffect(() => {
        if (data?.message) {
            const updatedModules = data.message.map((el: Module) => ({
                ...el,
                checked: el.price <= range,
            }));
            setModulesData(
                updatedModules.sort((a: Module, b: Module) => (a.price > b.price ? 1 : -1))
            );

            // const filterModules = data.message.filter((el: Module) => el.price <= value);
            // setElements(filterModules);
        }
    }, [range]);

    console.log(modulesData);

    console.log(range, value);

    // const handleCheckboxClick = (modulePrice: number) => {
    //     setValue(modulePrice);
    // };

    if (isLoading) {
        return <div className={classes.container}>Loading...</div>;
    }

    if (isError || !data?.message) {
        return <div className={classes.container}>Error loading modules</div>;
    }

    const handleClick = (id: number) => {
        setModulesData(
            modulesData.map((el) => {
                if (el.id === id && el.price > 350000) {
                    el.checked = !el.checked;
                }
                return el;
            })
        );

        let data = modulesData
            .filter((el) => el.checked === true)
            .sort((a, b) => (a.price > b.price ? 1 : -1));

        setValue(+data[data?.length - 1].price);
    };

    const list = modulesData.map((el: Module) => {
        return (
            <div
                key={el.id}
                className={classes.module_card}
                onClick={() => {
                    handleClick(el.id);
                    handleActive();
                }}
            >
                <div className={`${classes.check} ${el.checked ? classes.active : ""}`}></div>
                <h4 className={`${lang === "arm" && classes.arm}`}>
                    {lang === "arm" ? el.name : el.name_eng}
                </h4>
            </div>
        );
    });

    return <div className={classes.container}>{list}</div>;
};

export default Modules;
