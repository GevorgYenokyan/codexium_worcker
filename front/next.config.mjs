/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ["codexium.it", "localhost", "lh3.googleusercontent.com"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "codexium.it",
                port: "",
                pathname: "/api/uploads/**",
            },
            { protocol: "https", hostname: "replicate.delivery" },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
                port: "",
                pathname: "/a/**",
            },
        ],
    },
    headers: async () => [
        {
            source: "/:path*",
            headers: [
                { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
                { key: "X-Frame-Options", value: "SAMEORIGIN" },
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-XSS-Protection", value: "1; mode=block" },
                { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                { key: "Permissions-Policy", value: "geolocation=()..." },
            ],
        },
    ],
    api: {
        bodyParser: {
            sizeLimit: "20mb",
        },
    },
};

export default nextConfig;

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//     images: {
//         domains: ["codexium.it", "localhost", "lh3.googleusercontent.com"],
//         remotePatterns: [
//             {
//                 protocol: "https",
//                 hostname: "codexium.it",
//                 port: "",
//                 pathname: "/api/uploads/**",
//             },

//             { protocol: "https", hostname: "replicate.delivery" },
//             {
//                 protocol: "https",
//                 hostname: "lh3.googleusercontent.com",
//                 port: "",
//                 pathname: "/a/**",
//             },
//         ],
//     },
//     headers: async () => [
//         {
//             source: "/:path*",
//             headers: [
//                 {
//                     key: "Cross-Origin-Opener-Policy",
//                     value: "same-origin",
//                 },
//                 {
//                     key: "Cross-Origin-Embedder-Policy",
//                     value: "require-corp",
//                 },

//                 // Новые заголовки безопасности
//                 {
//                     key: "X-Frame-Options",
//                     value: "SAMEORIGIN",
//                 },
//                 {
//                     key: "X-Content-Type-Options",
//                     value: "nosniff",
//                 },
//                 {
//                     key: "X-XSS-Protection",
//                     value: "1; mode=block",
//                 },
//                 {
//                     key: "Referrer-Policy",
//                     value: "strict-origin-when-cross-origin",
//                 },
//                 {
//                     key: "Permissions-Policy",
//                     value: "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()",
//                 },
//                 // CSP - (Google OAuth + Replicate)
//                 {
//                     key: "Content-Security-Policy",
//                     value: [
//                         "default-src 'self'",
//                         "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js  unsafe-eval
//                         "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
//                         "font-src 'self' data: https://fonts.gstatic.com",
//                         "img-src 'self' data: https: blob:", // Google avatars и Replicate
//                         "connect-src 'self' https://codexium.it https://replicate.delivery https://lh3.googleusercontent.com",
//                         "frame-src 'self'",
//                         "base-uri 'self'",
//                         "form-action 'self'",
//                     ].join("; "),
//                 },
//             ],
//         },
//     ],
//     // headers: async () => [
//     //     {
//     //         source: "/(.*)",
//     //         headers: [
//     //             { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
//     //             { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
//     //         ],
//     //     },
//     // ],
// };

// export default nextConfig;
