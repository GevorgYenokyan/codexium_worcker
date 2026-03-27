import "next-auth";

declare module "next-auth" {
    interface Session {
        backendToken?: string;
    }

    interface User {
        backendToken?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        backendToken?: string;
    }
}
