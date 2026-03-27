import "./globals.css";
import { Suspense } from "react";

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        // <html lang="en">
        //     <body>
        <Suspense>
            <div className="dashboard">
                <div className={"sideBar"}></div>
                <div className="tables">{children}</div>
            </div>
        </Suspense>
        //      </body>
        // </html>
    );
}
