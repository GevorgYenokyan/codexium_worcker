import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

type Leng = "arm" | "eng";

interface Lenguages {
    leng: Leng;
}
let leng: Lenguages = {
    leng: "eng",
};

export const translationSlice = createSlice({
    name: "translation",
    initialState: leng,
    reducers: {
        setTranslation: (state, action: PayloadAction<Leng>) => {
            state.leng = action.payload;
        },
    },
});

export const { setTranslation } = translationSlice.actions;

export default translationSlice.reducer;
