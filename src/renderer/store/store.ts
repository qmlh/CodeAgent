/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import { appSlice } from './slices/appSlice';
import { uiSlice } from './slices/uiSlice';
import { fileSlice } from './slices/fileSlice';
import { agentSlice } from './slices/agentSlice';
import { taskSlice } from './slices/taskSlice';
import { themeSlice } from './slices/themeSlice';
import { systemSlice } from './slices/systemSlice';
import { conflictSlice } from './slices/conflictSlice';
import browserReducer from './slices/browserSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    ui: uiSlice.reducer,
    file: fileSlice.reducer,
    agent: agentSlice.reducer,
    task: taskSlice.reducer,
    theme: themeSlice.reducer,
    system: systemSlice.reducer,
    conflict: conflictSlice.reducer,
    browser: browserReducer,
    settings: settingsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    }),
  devTools: process.env.NODE_ENV === 'development'
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;