import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isAddItemSheetOpen: boolean;
  isStyleChatOpen: boolean;
  activeTab: string;
  toastMessage: { message: string; type: 'success' | 'error' | 'info' } | null;
}

const initialState: UIState = {
  isAddItemSheetOpen: false,
  isStyleChatOpen: false,
  activeTab: 'home',
  toastMessage: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAddItemSheet: (state) => { state.isAddItemSheetOpen = true; },
    closeAddItemSheet: (state) => { state.isAddItemSheetOpen = false; },
    openStyleChat: (state) => { state.isStyleChatOpen = true; },
    closeStyleChat: (state) => { state.isStyleChatOpen = false; },
    setActiveTab: (state, action: PayloadAction<string>) => { state.activeTab = action.payload; },
    showToast: (state, action: PayloadAction<UIState['toastMessage']>) => {
      state.toastMessage = action.payload;
    },
    clearToast: (state) => { state.toastMessage = null; },
  },
});

export const { openAddItemSheet, closeAddItemSheet, openStyleChat, closeStyleChat, setActiveTab, showToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;
