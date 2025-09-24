/**
 * Redux Hooks
 * Typed hooks for Redux store
 */
import { TypedUseSelectorHook } from 'react-redux';
import type { RootState } from '../store/store';
export declare const useAppDispatch: () => import("redux-thunk").ThunkDispatch<{
    app: import("../store/slices/appSlice").AppState;
    ui: import("../store/slices/uiSlice").UIState;
    file: import("../store/slices/fileSlice").FileState;
    agent: import("../store/slices/agentSlice").AgentState;
    task: import("../store/slices/taskSlice").TaskState;
    theme: import("../store/slices/themeSlice").ThemeState;
}, undefined, import("redux").UnknownAction> & import("redux").Dispatch<import("redux").UnknownAction>;
export declare const useAppSelector: TypedUseSelectorHook<RootState>;
