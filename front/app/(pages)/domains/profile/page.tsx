"use client";
import { useGetUserByIdQuery } from "@/app/redux/features/api/nameApi";
import React from "react";

const Page = () => {
    const { data } = useGetUserByIdQuery({});

    return <div>

              
    </div>;
};

export default Page;
