"use client";

import { configureStore } from "@reduxjs/toolkit";
import translationReducer from "./features/translations/translationsSlice";
import { codexiumApi } from "./features/api/codexiumApi";
import searchReducer from "./features/search/searchSlice";
import { nameApi } from "./features/api/nameApi";

export const store = configureStore({
    reducer: {
        translation: translationReducer,
        search: searchReducer,
        [codexiumApi.reducerPath]: codexiumApi.reducer,
        [nameApi.reducerPath]: nameApi.reducer,
    },
    middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware({}).concat([codexiumApi.middleware, nameApi.middleware]);
    },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
