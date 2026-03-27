import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface Search {
    search: string;
    id?: string | null | number;
}

const initialSearch: Search = { search: "", id: null };

export const searchSlice = createSlice({
    name: "search",
    initialState: initialSearch,
    reducers: {
        setSearch: (state, action: PayloadAction<string>) => {
            state.search = action.payload;
        },
        setParams: (state, action: PayloadAction<string | number>) => {
            state.id = action.payload;
        },
    },
});

export const { setSearch, setParams } = searchSlice.actions;

export default searchSlice.reducer;
