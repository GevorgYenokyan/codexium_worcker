"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import authHeader from "@/app/api/authHeader";
import requestQuery from "@/app/api/requestQuery";

interface IHeader {
    "Content-Type": string;
    Authorization?: string;
}

export const codexiumApi = createApi({
    reducerPath: "codexiumApi",
    tagTypes: ["user", "nfc"],
    baseQuery: fetchBaseQuery({
        baseUrl: `/proxy/`,
        prepareHeaders: (headers) => {
            // const Header: IHeader = authHeader();
            // headers.set("Content-Type", Header["Content-Type"]);
            // headers.set("Authorization", Header["Authorization"] || "token");
            return headers;
        },
    }),

    endpoints: (builder) => ({
        //authorization-user-actions
        registration: builder.mutation({
            query(body) {
                return {
                    url: `registration`,
                    method: "POST",
                    body,
                };
            },

            invalidatesTags: ["user"],
        }),
        login: builder.mutation({
            query(body) {
                return {
                    url: `login`,
                    method: "POST",
                    body,
                };
            },

            invalidatesTags: ["user"],
        }),

        addUserImage: builder.mutation({
            query(body) {
                return {
                    url: `user/images`,
                    method: "POST",
                    body,
                };
            },

            invalidatesTags: ["user"],
        }),
        deleteUserImage: builder.mutation({
            query(id: number) {
                return {
                    url: `user/images/${id}`,
                    method: "DELETE",
                };
            },
            invalidatesTags: ["user"],
        }),
        updateUser: builder.mutation({
            query(body) {
                return {
                    url: `users`,
                    method: "PATCH",
                    body,
                };
            },

            invalidatesTags: ["user"],
        }),

        getUserById: builder.query({
            query: () => {
                const queryStr = `userByID`;
                return { url: queryStr };
            },
            providesTags: ["user"],
        }),

        getUserByIDPage: builder.query<any, Object>({
            query: (id) => {
                const queryStr = `userBiId${id}`;
                return { url: queryStr };
            },
            providesTags: ["user"],
        }),

        getSpecialist: builder.query<any, Object>({
            query: (queryParams) => {
                const queryStr = `usersSimple${requestQuery(queryParams)}&sort=${JSON.stringify([
                    "id",
                    "DESC",
                ])}`;
                return { url: queryStr };
            },
            providesTags: ["user"],
        }),

        activate: builder.mutation({
            query(body) {
                return {
                    url: `activate`,
                    method: "PUT",
                    body,
                };
            },
        }),

        forgotPassword: builder.mutation({
            query(body) {
                return {
                    url: `forgotPassword`,
                    method: "POST",
                    body,
                };
            },
        }),

        recoverPassword: builder.mutation({
            query(body) {
                return {
                    url: `recoverPassword`,
                    method: "POST",
                    body,
                };
            },
        }),
        getNews: builder.query<any, Object>({
            query: (queryParams) => {
                const queryStr = `news${requestQuery(queryParams)}&sort=${JSON.stringify([
                    "id",
                    "DESC",
                ])}`;
                return { url: queryStr };
            },
        }),
        getNewsById: builder.query<any, string>({
            query: (id) => {
                const queryStr = `news/${id}`;
                return { url: queryStr };
            },
        }),
        getTestimonials: builder.query<any, Object>({
            query: (queryParams) => {
                const queryStr = `feedbacks${requestQuery(queryParams)}&sort=${JSON.stringify([
                    "id",
                    "DESC",
                ])}`;
                return { url: queryStr };
            },
        }),

        getAppmoduls: builder.query<any, Object>({
            query: (queryParams) => {
                const queryStr = `appmoduls${requestQuery(queryParams)}&sort=${JSON.stringify([
                    "id",
                    "DESC",
                ])}`;
                return { url: queryStr };
            },
        }),
        getPortfolioById: builder.query<any, string>({
            query: (id) => {
                const queryStr = `portfolio/${id}`;
                return { url: queryStr };
            },
        }),
        getPortfolios: builder.query<any, Object>({
            query: (queryParams) => {
                const queryStr = `portfolio${requestQuery(queryParams)}&sort=${JSON.stringify([
                    "id",
                    "DESC",
                ])}`;
                return { url: queryStr };
            },
        }),

        nfcOrder: builder.mutation({
            query(body) {
                return {
                    url: `nfc`,
                    method: "POST",
                    body,
                };
            },

            invalidatesTags: ["nfc"],
        }),

        updateNfc: builder.mutation({
            query({ body, id }) {
                return {
                    url: `nfc/${id}`,
                    method: "PATCH",
                    body,
                };
            },

            invalidatesTags: ["nfc"],
        }),

        getNfc: builder.query<any, Object>({
            query: (queryParams) => {
                const queryStr = `nfc${requestQuery(queryParams)}&sort=${JSON.stringify([
                    "id",
                    "DESC",
                ])}`;
                return { url: queryStr };
            },
            providesTags: ["nfc"],
        }),

        siteOrder: builder.mutation({
            query(body) {
                return {
                    url: `orders`,
                    method: "POST",
                    body,
                };
            },
        }),

        securityHeaders: builder.mutation({
            query(body) {
                return {
                    url: `security-headers/scan`,
                    method: "POST",
                    body,
                };
            },
        }),
        sslCheck: builder.mutation({
            query(body) {
                return {
                    url: `ssl-check/scan`,
                    method: "POST",
                    body,
                };
            },
        }),

        whoisLookup: builder.mutation({
            query: (body) => ({ url: "whois/lookup", method: "POST", body }),
        }),
        dnsLookup: builder.mutation({
            query: (body) => ({ url: "/dns-lookup", method: "POST", body }),
        }),
        techDetect: builder.mutation({
            query: (body) => ({ url: "/tech-detect", method: "POST", body }),
        }),
        emailSecurity: builder.mutation({
            query: (body) => ({ url: "/email-security", method: "POST", body }),
        }),
    }),
});

export const {
    useLoginMutation,
    useGetUserByIdQuery,
    useRegistrationMutation,
    useActivateMutation,
    useAddUserImageMutation,
    useDeleteUserImageMutation,
    useForgotPasswordMutation,
    useUpdateUserMutation,
    useRecoverPasswordMutation,
    useGetNewsQuery,
    useGetNewsByIdQuery,
    useGetTestimonialsQuery,
    useGetAppmodulsQuery,
    useGetPortfolioByIdQuery,
    useGetPortfoliosQuery,
    useGetNfcQuery,
    useNfcOrderMutation,
    useSiteOrderMutation,
    useUpdateNfcMutation,
    useSecurityHeadersMutation,
    useSslCheckMutation,
    useWhoisLookupMutation,
    useDnsLookupMutation,
    useTechDetectMutation,
    useEmailSecurityMutation,
} = codexiumApi;
