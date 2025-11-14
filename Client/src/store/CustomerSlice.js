import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  customers: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// Async thunks for API calls
export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("http://localhost:8080/customers", {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Fetch Customers Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch customers"
      );
    }
  }
);

export const addCustomer = createAsyncThunk(
  "customers/addCustomer",
  async (newCustomer, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:8080/customers",
        newCustomer,
        { withCredentials: true }
      );
      return response.data; // This should be the new customer object with ID
    } catch (error) {
      console.error(
        "Add Customer Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data?.error || "Failed to add customer"
      );
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  "customers/deleteCustomer",
  async (customerId, { rejectWithValue }) => {
    try {
      await axios.delete(`http://localhost:8080/customers/${customerId}`, {
        withCredentials: true,
      });
      return customerId; // Return the ID of the deleted customer
    } catch (error) {
      console.error(
        "Delete Customer Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete customer"
      );
    }
  }
);

// Customer slice
const customerSlice = createSlice({
  name: "customers",
  initialState,
  // --- ADD THIS REDUCER ---
  reducers: {
    clearCustomers: (state) => {
      state.customers = [];
      state.status = "idle";
      state.error = null;
    },
  },
  // --- END OF ADDITION ---
  extraReducers: (builder) => {
    builder
      // Fetch Customers
      .addCase(fetchCustomers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Add Customer
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
      })
      // Delete Customer
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter(
          (customer) => customer.id !== action.payload
        );
      });
  },
});

// --- EXPORT THE NEW ACTION ---
export const { clearCustomers } = customerSlice.actions;
export default customerSlice.reducer;