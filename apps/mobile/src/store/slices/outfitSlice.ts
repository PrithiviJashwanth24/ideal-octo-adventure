import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OutfitRecommendation {
  safe?: any;
  statement?: any;
  stealthLuxury?: any;
  dateNight?: any;
  boardroom?: any;
  rationale: string;
  contextUsed: Record<string, any>;
}

interface OutfitState {
  todayRecommendations: OutfitRecommendation | null;
  savedOutfits: any[];
  currentOutfit: any | null;
  isGenerating: boolean;
  lastGenerated: number | null;
}

const initialState: OutfitState = {
  todayRecommendations: null,
  savedOutfits: [],
  currentOutfit: null,
  isGenerating: false,
  lastGenerated: null,
};

const outfitSlice = createSlice({
  name: 'outfit',
  initialState,
  reducers: {
    setRecommendations: (state, action: PayloadAction<OutfitRecommendation>) => {
      state.todayRecommendations = action.payload;
      state.lastGenerated = Date.now();
      state.isGenerating = false;
    },
    setSavedOutfits: (state, action: PayloadAction<any[]>) => {
      state.savedOutfits = action.payload;
    },
    addSavedOutfit: (state, action: PayloadAction<any>) => {
      state.savedOutfits.unshift(action.payload);
    },
    setCurrentOutfit: (state, action: PayloadAction<any>) => {
      state.currentOutfit = action.payload;
    },
    setGenerating: (state, action: PayloadAction<boolean>) => {
      state.isGenerating = action.payload;
    },
  },
});

export const { setRecommendations, setSavedOutfits, addSavedOutfit, setCurrentOutfit, setGenerating } = outfitSlice.actions;
export default outfitSlice.reducer;
