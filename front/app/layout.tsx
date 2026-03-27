// import type { Metadata } from "next";

import "./globals.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Menu from "./navigation/menu/menu";
import Providers from "./redux/provider";
import {
    MontseratLight,
    MontseratSemiBold,
    MontserratRegular,
    MontseratBold,
} from "./utils/fontsConfig";
import { Suspense } from "react";
import Footer from "./navigation/footer/footer";
import { GoogleAnalytics } from "@next/third-parties/google";
import Contacts from "./components/contacts/contacts";
import AuthProvider from "./lib/next_auth/provider";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <Providers>
                <AuthProvider>
                    <body
                        className={`${MontseratLight.variable} ${MontseratSemiBold.variable} ${MontserratRegular.variable} ${MontseratBold.variable}`}
                    >
                        <Suspense>
                            <Menu />

                            {children}
                            <Contacts />
                            <Footer />
                        </Suspense>
                    </body>
                </AuthProvider>
            </Providers>
            <GoogleAnalytics gaId="G-4EP97VKPZ0" />
        </html>
    );
}
