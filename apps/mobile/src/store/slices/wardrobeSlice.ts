import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WardrobeItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  colorPrimary?: string;
  thumbnailUrl?: string;
  images: { url: string; isPrimary: boolean }[];
  wearCount: number;
  isFavorite: boolean;
  isArchived: boolean;
  laundryStatus: string;
  versatilityScore: number;
  confidenceBoost: number;
  occasionTags: string[];
  styleArchetypes: string[];
}

interface WardrobeState {
  items: WardrobeItem[];
  selectedCategory: string | null;
  searchQuery: string;
  isLoading: boolean;
  lastFetched: number | null;
  stats: {
    totalItems: number;
    utilizationRate: number;
    closetHealthScore: number;
    totalValue: number;
    neglectedItemCount: number;
  } | null;
}

const initialState: WardrobeState = {
  items: [],
  selectedCategory: null,
  searchQuery: '',
  isLoading: false,
  lastFetched: null,
  stats: null,
};

const wardrobeSlice = createSlice({
  name: 'wardrobe',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<WardrobeItem[]>) => {
      state.items = action.payload;
      state.lastFetched = Date.now();
      state.isLoading = false;
    },
    addItem: (state, action: PayloadAction<WardrobeItem>) => {
      state.items.unshift(action.payload);
    },
    updateItem: (state, action: PayloadAction<WardrobeItem>) => {
      const idx = state.items.findIndex((i) => i.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) item.isFavorite = !item.isFavorite;
    },
    setCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setStats: (state, action: PayloadAction<WardrobeState['stats']>) => {
      state.stats = action.payload;
    },
  },
});

export const { setItems, addItem, updateItem, removeItem, toggleFavorite, setCategory, setSearchQuery, setLoading, setStats } = wardrobeSlice.actions;
export default wardrobeSlice.reducer;
