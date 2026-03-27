import { EmailSecurityResult, GRADE_COLOR } from "./emailSecurityTypes";
import classes from "../style/emailGradeBanner.module.scss";

type Props = Pick<EmailSecurityResult, "grade" | "domain" | "score" | "summary">;

export function EmailGradeBanner({ grade, domain, score, summary }: Props) {
    return (
        <div className={classes.banner}>
            <div
                className={classes.circle}
                style={{ borderColor: GRADE_COLOR[grade], color: GRADE_COLOR[grade] }}
            >
                {grade}
            </div>
            <div className={classes.info}>
                <p className={classes.domain}>{domain}</p>
                <p className={classes.score}>Score: {score}/100</p>
                <div className={classes.tags}>
                    <span className={classes.tagPassed}>✓ {summary.passed} passed</span>
                    {summary.warnings > 0 && (
                        <span className={classes.tagWarn}>⚠ {summary.warnings} warnings</span>
                    )}
                    {summary.failed > 0 && (
                        <span className={classes.tagFailed}>✗ {summary.failed} failed</span>
                    )}
                </div>
            </div>
        </div>
    );
}
