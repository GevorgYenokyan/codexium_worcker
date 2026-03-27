import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";

export const authConfig: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.CLIENT_ID!,
            clientSecret: process.env.CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: "/profile",
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google" && account.id_token) {
                try {
                    const response = await fetch(`https://codexium.it/api/google-login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ token: account.id_token }),
                    });

                    if (!response.ok) return false;

                    const data = await response.json();

                    if (data.token) {
                        // ✅ Устанавливаем httpOnly куки прямо здесь — на сервере
                        const cookieStore = await cookies();
                        cookieStore.set("JWT", data.token, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === "production",
                            sameSite: "lax",
                            path: "/",
                            maxAge: 60 * 60 * 24 * 7,
                        });

                        return true;
                    }

                    return false;
                } catch (error) {
                    console.error("Backend auth error:", error);
                    return false;
                }
            }

            return true;
        },

        // jwt и session теперь не нужны для backendToken
        async jwt({ token }) {
            return token;
        },

        async session({ session }) {
            return session; // backendToken больше не светим на клиент
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

// import { AuthOptions } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
// import { NextAuthOptions } from "next-auth";
// import { cookies } from "next/headers";

// export const authConfig: NextAuthOptions = {
//     providers: [
//         GoogleProvider({
//             clientId: process.env.CLIENT_ID!,
//             clientSecret: process.env.CLIENT_SECRET!,
//         }),
//     ],
//     pages: {
//         signIn: "/",
//     },
//     callbacks: {
//         async signIn({ user, account, profile }) {
//             if (account?.provider === "google" && account.id_token) {
//                 try {
//                     const response = await fetch(`https://codexium.it/api/google-login`, {
//                         method: "POST",
//                         headers: {
//                             "Content-Type": "application/json",
//                         },
//                         body: JSON.stringify({
//                             token: account.id_token, // ✅ ID Token от Google
//                         }),
//                     });

//                     if (!response.ok) {
//                         const error = await response.json();
//                         console.error("Backend auth failed:", error);
//                         return false; // ❌ Блокируем вход
//                     }

//                     const data = await response.json();

//                     if (data.token) {
//                         // ✅ Сохраняем твой JWT токен в user объекте
//                         (user as any).backendToken = data.token;

//                         return true; // ✅ Разрешаем вход
//                     }

//                     return false;
//                 } catch (error) {
//                     console.error("Backend auth error:", error);
//                     return false;
//                 }
//             }

//             return true;
//         },

//         async jwt({ token, user, account }) {
//             // ✅ Сохраняем твой backend токен в JWT
//             if (user && (user as any).backendToken) {
//                 token.backendToken = (user as any).backendToken;
//             }

//             return token;
//         },

//         async session({ session, token }) {
//             // ✅ Передаем токен в session (только на сервере!)
//             if (token.backendToken) {
//                 (session as any).backendToken = token.backendToken;
//             }

//             return session;
//         },
//     },
//     secret: process.env.NEXTAUTH_SECRET,
// };
