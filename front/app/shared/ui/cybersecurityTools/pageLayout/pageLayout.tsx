import classes from "./pageLayout.module.scss";

interface PageLayoutProps {
    title: string;
    subtitle: string;
    children: React.ReactNode;
}

export function PageLayout({ title, subtitle, children }: PageLayoutProps) {
    return (
        <div className={classes.page}>
            <div className={classes.container}>
                <div className={classes.heading}>
                    <h1 className={classes.title}>{title}</h1>
                    <p className={classes.subtitle}>{subtitle}</p>
                </div>
                {children}
            </div>
        </div>
    );
}
