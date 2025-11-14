import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_BASE_URL } from "../apiConfig"; // Assuming you have this

// Helper to get credentials for fetch
const getAuthCredentials = () => {
  // We use 'credentials: "include"' to send the HttpOnly cookie
  return { credentials: "include" };
};

export const fetchItemSuggestions = createAsyncThunk(
  "items/fetchItemSuggestions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/items/suggestions`,
        getAuthCredentials()
      );

      if (!response.ok) {
        const err = await response.json();
        return rejectWithValue(err.error || "Failed to fetch item suggestions");
      }
      // Returns an array of strings, e.g., ["Gold", "Design", "Printing"]
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // This will store the master list of unique item names
  names: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const itemSlice = createSlice({
  name: "items",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchItemSuggestions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchItemSuggestions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.names = action.payload; // Payload is the string[]
      })
      .addCase(fetchItemSuggestions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export default itemSlice.reducer;