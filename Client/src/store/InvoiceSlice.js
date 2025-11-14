import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { addDays, format } from "date-fns";
import axios from "axios";

const initialState = {
  invoices: [],
  filter: "all",
  isFormOpen: false,
  selectedInvoice: null,
  status: "idle",
  error: null,
};

// Async thunks for API calls
export const fetchInvoices = createAsyncThunk(
  "invoices/fetchInvoices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("http://localhost:8080/invoices", {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Fetch Invoices Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch invoices"
      );
    }
  }
);

export const addInvoice = createAsyncThunk(
  "invoices/addInvoice",
  async (invoice, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:8080/invoices",
        invoice,
        { withCredentials: true }
      );
      return { ...invoice, id: response.data.id };
    } catch (error) {
      console.error(
        "Add Invoice Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data?.error || "Failed to add invoice"
      );
    }
  }
);

export const updateInvoice = createAsyncThunk(
  "invoices/updateInvoice",
  async (invoice, { rejectWithValue }) => {
    try {
      if (!invoice.id) {
        throw new Error("Invoice ID is required for update");
      }
      const response = await axios.put(
        "http://localhost:8080/invoices",
        invoice,
        { withCredentials: true }
      );
      return invoice;
    } catch (error) {
      console.error(
        "Update Invoice Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data?.error || "Failed to update invoice"
      );
    }
  }
);

export const deleteInvoice = createAsyncThunk(
  "invoices/deleteInvoice",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        throw new Error("Invoice ID is required for deletion");
      }
      await axios.delete(`http://localhost:8080/invoices/${id}`, {
        withCredentials: true,
      });
      return id;
    } catch (error) {
      console.error(
        "Delete Invoice Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete invoice"
      );
    }
  }
);

export const markAsPaid = createAsyncThunk(
  "invoices/markAsPaid",
  async (id, { rejectWithValue }) => {
    try {
      await axios.post(
        "http://localhost:8080/invoices/mark-paid",
        { id },
        { withCredentials: true }
      );
      return id;
    } catch (error) {
      console.error(
        "Mark as Paid Error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data?.error || "Failed to mark invoice as paid"
      );
    }
  }
);

const calculateAmount = (items) => {
  return items.reduce((acc, item) => acc + (item.quantity * item.rate || 0), 0);
};

const invoiceSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    toggleForm: (state) => {
      state.isFormOpen = !state.isFormOpen;
      if (!state.isFormOpen) {
        state.selectedInvoice = null;
      }
    },
    setSelectedInvoice: (state, action) => {
      state.selectedInvoice = action.payload;
    },
    // --- ADD THIS REDUCER ---
    clearInvoices: (state) => {
      state.invoices = [];
      state.filter = "all";
      state.isFormOpen = false;
      state.selectedInvoice = null;
      state.status = "idle";
      state.error = null;
    },
    // --- END OF ADDITION ---
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.invoices = action.payload;
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(addInvoice.fulfilled, (state, action) => {
        const newInvoice = {
          ...action.payload,
          amount: Number(calculateAmount(action.payload.items) || 0),
          status: action.payload.status || "pending",
          dueDate:
            action.payload.dueDate ||
            format(addDays(new Date(), 30), "yyyy-MM-dd"),
        };
        state.invoices.push(newInvoice);
        state.isFormOpen = false;
      })
      .addCase(addInvoice.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateInvoice.fulfilled, (state, action) => {
        const updatedInvoice = {
          ...action.payload,
          amount: calculateAmount(action.payload.items || []),
        };
        const index = state.invoices.findIndex(
          (inv) => inv.id === updatedInvoice.id
        );
        if (index !== -1) {
          state.invoices[index] = updatedInvoice;
        }
        state.selectedInvoice = updatedInvoice;
        state.isFormOpen = false;
      })
      .addCase(updateInvoice.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.invoices = state.invoices.filter(
          (inv) => inv.id !== action.payload
        );
        state.selectedInvoice = null;
      })
      .addCase(deleteInvoice.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(markAsPaid.fulfilled, (state, action) => {
        const invoice = state.invoices.find((inv) => inv.id === action.payload);
        if (invoice) {
          invoice.status = "paid";
          state.selectedInvoice = null;
          state.isFormOpen = false;
        }
      })
      .addCase(markAsPaid.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

// --- EXPORT THE NEW ACTION ---
export const { toggleForm, setFilter, setSelectedInvoice, clearInvoices } =
  invoiceSlice.actions;
export default invoiceSlice.reducer;