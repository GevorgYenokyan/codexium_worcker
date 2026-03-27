"use client";

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import requestQuery from "@/app/api/requestQuery";
import authHeader from "@/app/api/authNameHeader";

interface IHeader {
    "Content-Type": string;
    Authorization?: string;
}

export const nameApi = createApi({
    reducerPath: "nameApi",
    tagTypes: ["user", "nfc"],
    baseQuery: fetchBaseQuery({
        baseUrl: `https://api.name.am/`,
        prepareHeaders: (headers) => {
            const Header: IHeader = authHeader();
            // headers.set("Content-Type", Header["Content-Type"]);
            headers.set("Authorization", Header["Authorization"] || "token");
            return headers;
        },
    }),

    endpoints: (builder) => ({
        //authorization-user-actions
        registration: builder.mutation({
            query(body) {
                return {
                    url: `auth/register`,
                    method: "POST",
                    redirect: "follow",
                    body,
                };
            },

            invalidatesTags: ["user"],
        }),
        login: builder.mutation({
            query(body) {
                return {
                    url: `auth/login`,
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
                const queryStr = `client/user`;
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
} = nameApi;
