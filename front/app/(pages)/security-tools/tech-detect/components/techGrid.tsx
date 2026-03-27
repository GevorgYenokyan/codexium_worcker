import { DetectedTech, CAT } from "./techDetectTypes";
import classes from "../style/techGrid.module.scss";

interface TechGridProps {
    technologies: DetectedTech[];
}

export function TechGrid({ technologies }: TechGridProps) {
    if (technologies.length === 0) return null;

    return (
        <div className={classes.grid}>
            {technologies.map((tech) => {
                const cfg = CAT[tech.category];
                return (
                    <div key={tech.name} className={classes.card}>
                        <div className={classes.cardTop}>
                            <span
                                className={classes.catBadge}
                                style={{
                                    color: cfg.color,
                                    borderColor: cfg.color + "40",
                                    backgroundColor: cfg.color + "10",
                                }}
                            >
                                {cfg.icon} {tech.category}
                            </span>
                            <span
                                className={`${classes.confBadge} ${classes[`conf_${tech.confidence}`]}`}
                            >
                                {tech.confidence}
                            </span>
                        </div>
                        <p className={classes.techName}>
                            {tech.name}
                            {tech.version && (
                                <span className={classes.techVer}> v{tech.version}</span>
                            )}
                        </p>
                        <p className={classes.techBy}>{tech.detectedBy}</p>
                    </div>
                );
            })}
        </div>
    );
}
