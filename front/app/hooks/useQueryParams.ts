import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import requestQuery from "../api/requestQuery";

export default function useQueryParams() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams);
            params.set(name, value);
            return params.toString();
        },
        [searchParams],
    );

    const setQueryParam = (queryName: string, value: string) => {
        const queryString = createQueryString(queryName, value);
        router.push(`${pathname}?${queryString}`);
    };
    const setQuery = <T>(object: T) => {
        router.push(`${pathname}${requestQuery(object)}`);
    };

    const updateQueryParam = (queryName: string, value: string | number) => {
        const params = new URLSearchParams(searchParams);

        if (value === null) {
            params.delete(queryName);
        } else {
            params.set(queryName, `${value}`);
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    return {
        queryParams: searchParams,
        createQueryString,
        setQueryParam,
        setQuery,
        updateQueryParam,
    };
}
