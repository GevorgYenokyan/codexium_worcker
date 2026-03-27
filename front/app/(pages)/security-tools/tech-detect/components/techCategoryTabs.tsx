import { TechCategory, CAT } from "./techDetectTypes";
import classes from "../style/techCategoryTabs.module.scss";

interface TechCategoryTabsProps {
    activeTab: TechCategory | "all";
    foundCats: TechCategory[];
    total: number;
    byCategory: Record<string, number>;
    onChange: (tab: TechCategory | "all") => void;
}

export function TechCategoryTabs({
    activeTab,
    foundCats,
    total,
    byCategory,
    onChange,
}: TechCategoryTabsProps) {
    return (
        <div className={classes.tabs}>
            <button
                className={`${classes.tab} ${activeTab === "all" ? classes.tabActive : ""}`}
                onClick={() => onChange("all")}
            >
                All ({total})
            </button>

            {foundCats.map((cat) => (
                <button
                    key={cat}
                    className={`${classes.tab} ${activeTab === cat ? classes.tabActive : ""}`}
                    style={
                        activeTab === cat
                            ? { borderBottomColor: CAT[cat].color, color: CAT[cat].color }
                            : {}
                    }
                    onClick={() => onChange(cat)}
                >
                    {CAT[cat].icon} {cat} ({byCategory[cat]})
                </button>
            ))}
        </div>
    );
}
