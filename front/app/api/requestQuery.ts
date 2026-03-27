const requestQuery = <T>(object: T): string => {
    let query = "";
    for (let key in object) {
        query += key + "=" + object[key] + "&";
    }

    if (!query) return query;

    return "?" + query.substring(0, query.length - 1);
};

export default requestQuery;

// const generateQueryStr = (baseString: string, query: Object): string => {
//     const queryString: string =
//         baseString +
//         Object.entries(query)
//             .map(([key, value]) => `${key}=${value}`)
//             .join("&");
//     return queryString;
// };
