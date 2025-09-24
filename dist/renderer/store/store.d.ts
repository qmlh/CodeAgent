/**
 * Redux Store Configuration
 */
export declare const store: import("@reduxjs/toolkit").EnhancedStore<{
    app: import("./slices/appSlice").AppState;
    ui: import("./slices/uiSlice").UIState;
    file: import("./slices/fileSlice").FileState;
    agent: import("./slices/agentSlice").AgentState;
    task: import("./slices/taskSlice").TaskState;
    theme: import("./slices/themeSlice").ThemeState;
}, import("redux").UnknownAction, import("@reduxjs/toolkit").Tuple<[import("redux").StoreEnhancer<{
    dispatch: import("redux-thunk").ThunkDispatch<{
        app: import("./slices/appSlice").AppState;
        ui: import("./slices/uiSlice").UIState;
        file: import("./slices/fileSlice").FileState;
        agent: import("./slices/agentSlice").AgentState;
        task: import("./slices/taskSlice").TaskState;
        theme: import("./slices/themeSlice").ThemeState;
    }, undefined, import("redux").UnknownAction>;
}>, import("redux").StoreEnhancer]>>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
