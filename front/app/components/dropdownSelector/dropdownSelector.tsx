"use client";
import { FC, ReactNode, useState, useEffect, useRef } from "react";
import classes from "./dropdownSelector.module.scss";
import { Option } from "@/app/types/types";
import Image from "next/image";

interface DropdownSelectorProps {
    data?: Option[];
    selectedValue: string;
    className?: string;
    selectorClassName?: string;
    onSelect: (option: Option | null) => void;
    enableSearch?: boolean;
    onSearch?: (data: string) => void;
    children?: ReactNode;
    onClear?: boolean;
    imgLabel?: boolean;
}

const DropdownSelector: FC<DropdownSelectorProps> = ({
    data = [],
    selectedValue,
    onSelect,
    className,
    selectorClassName = "",
    enableSearch = false,
    onSearch,
    children,
    onClear = false,
    imgLabel = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSelect = (option: Option) => {
        onSelect(option);
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleClear = () => {
        onSelect(null);
        setIsOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const filteredData = data.filter(
        (option) =>
            (option.label && option.label.toLowerCase().includes(searchTerm.toLowerCase())) ||
            option.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = data.find((option) => option.code === selectedValue);

    return (
        <div ref={dropdownRef} className={`${selectorClassName} ${classes["selectorContainer"]}`}>
            <div className={classes["selectorButtonWrapper"]}>
                <button onClick={() => setIsOpen(!isOpen)} className={classes["selectorButton"]}>
                    {selectedOption?.src ? (
                        <Image
                            src={selectedOption.src}
                            alt={selectedOption.label || ""}
                            width={50}
                            height={25}
                            style={{ height: "20px" }}
                        />
                    ) : (
                        selectedValue || "Select"
                    )}
                </button>
                {selectedValue && onClear && (
                    <button onClick={handleClear} className={classes["clearButton"]}>
                        ✕
                    </button>
                )}
            </div>

            {isOpen && (
                <div className={`${classes["dropdownWrapper"]} ${className}`}>
                    {enableSearch && (
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (onSearch) onSearch(e.target.value);
                            }}
                            className={classes["searchInput"]}
                        />
                    )}

                    <ul className={`${classes["dropdownMenu"]} ${classes["open"]}`}>
                        {filteredData.length > 0 ? (
                            filteredData.map((option) => (
                                <li key={option.code} onClick={() => handleSelect(option)}>
                                    {option.src ? (
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <Image
                                                src={option.src}
                                                alt={option.label || ""}
                                                width={50}
                                                height={25}
                                                style={{ height: "20px", marginRight: "10px" }}
                                            />
                                            {imgLabel && option.label}
                                        </div>
                                    ) : (
                                        option.label
                                    )}
                                </li>
                            ))
                        ) : (
                            <li className={classes["noResults"]}>No results found</li>
                        )}
                        {children}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default DropdownSelector;

// "use client";
// import { FC, ReactNode, useState } from "react";
// import classes from "./dropdownSelector.module.scss";
// import { Option } from "@/app/types/types";
// import Image from "next/image";

// interface DropdownSelectorProps {
//     data?: Option[];
//     selectedValue: string;
//     className?: string;
//     selectorClassName?: string;
//     onSelect: (option: Option) => void;
//     enableSearch?: boolean;
//     onSearch?: (data: string) => void;
//     children?: ReactNode;
// }

// const DropdownSelector: FC<DropdownSelectorProps> = ({
//     data = [],
//     selectedValue,
//     onSelect,
//     className,
//     selectorClassName = "",
//     enableSearch = false,
//     onSearch,
//     children,
// }) => {
//     const [isOpen, setIsOpen] = useState(false);
//     const [searchTerm, setSearchTerm] = useState("");

//     const handleSelect = (option: Option) => {
//         onSelect(option);
//         setIsOpen(false);
//         setSearchTerm("");
//     };

//     const filteredData = data.filter(
//         (option) =>
//             (option.label && option.label.toLowerCase().includes(searchTerm.toLowerCase())) ||
//             option.code.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     const selectedOption = data.find((option) => option.code === selectedValue);

//     return (
//         <div className={`${selectorClassName}  ${classes["selectorContainer"]} `}>
//             <button onClick={() => setIsOpen(!isOpen)} className={classes["selectorButton"]}>
//                 {selectedOption?.src ? (
//                     <Image
//                         src={selectedOption.src}
//                         alt={selectedOption.label || ""}
//                         width={50}
//                         height={25}
//                         style={{ height: "20px" }}
//                     />
//                 ) : (
//                     selectedValue
//                 )}
//             </button>

//             {isOpen && (
//                 <div className={`${classes["dropdownWrapper"]} ${className}`}>
//                     {enableSearch && (
//                         <input
//                             type="text"
//                             placeholder="Search..."
//                             value={searchTerm}
//                             onChange={(e) => {
//                                 setSearchTerm(e.target.value);
//                                 if (onSearch) {
//                                     onSearch(e.target.value);
//                                 }
//                             }}
//                             className={classes["searchInput"]}
//                         />
//                     )}

//                     <ul className={`${classes["dropdownMenu"]} ${classes["open"]}`}>
//                         {filteredData.length > 0 ? (
//                             filteredData.map((option) => (
//                                 <li key={option.code} onClick={() => handleSelect(option)}>
//                                     {option.src ? (
//                                         <div>
//                                             <Image
//                                                 src={option.src}
//                                                 alt={option.label || ""}
//                                                 width={50}
//                                                 height={25}
//                                                 style={{ height: "20px", marginRight: "10px" }}
//                                             />
//                                             {/* {option.code} */}
//                                         </div>
//                                     ) : (
//                                         option.label
//                                     )}
//                                 </li>
//                             ))
//                         ) : (
//                             <li className={classes["noResults"]}>No results found</li>
//                         )}
//                         {children}
//                     </ul>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default DropdownSelector;
