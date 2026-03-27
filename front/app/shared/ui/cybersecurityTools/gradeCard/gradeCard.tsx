import classes from "./gradeCard.module.scss";

export type Grade = "A+" | "A" | "B" | "C" | "D" | "F" | "T";

interface GradeCardSummary {
    passed: number;
    failed: number;
    warnings: number;
}

interface GradeCardProps {
    grade: Grade;
    host: string;
    description: string;
    meta: string;
    summary: GradeCardSummary;
}

const gradeClass: Record<Grade, string> = {
    "A+": classes.gradeAPlus,
    A: classes.gradeA,
    B: classes.gradeB,
    C: classes.gradeC,
    D: classes.gradeD,
    F: classes.gradeF,
    T: classes.gradeT,
};

export function GradeCard({ grade, host, description, meta, summary }: GradeCardProps) {
    return (
        <div className={`${classes.gradeCard} ${gradeClass[grade]}`}>
            <div className={classes.gradeLetter}>{grade}</div>
            <div className={classes.gradeInfo}>
                <p className={classes.gradeHost}>{host}</p>
                <p className={classes.gradeDesc}>{description}</p>
                <p className={classes.gradeMeta}>{meta}</p>
                <div className={classes.gradeSummary}>
                    <span className={classes.passed}>✓ {summary.passed} passed</span>
                    <span className={classes.failed}>✗ {summary.failed} failed</span>
                    {summary.warnings > 0 && (
                        <span className={classes.warnings}>⚠ {summary.warnings} warnings</span>
                    )}
                </div>
            </div>
        </div>
    );
}
