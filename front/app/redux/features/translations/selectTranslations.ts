import { RootState } from "../../store";

export function selectTranslations(state: RootState) {
    return state.translation;
}
