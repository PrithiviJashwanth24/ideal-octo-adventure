import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import wardrobeReducer from './slices/wardrobeSlice';
import uiReducer from './slices/uiSlice';
import outfitReducer from './slices/outfitSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    wardrobe: wardrobeReducer,
    outfit: outfitReducer,
    ui: uiReducer,
  },
  middleware: (getDefault) =>
    getDefault({ serializableCheck: { ignoredActions: ['persist/PERSIST'] } }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
