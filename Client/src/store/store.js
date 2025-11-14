import { configureStore } from "@reduxjs/toolkit";
import InvoiceReducer from "./InvoiceSlice";
import CustomerReducer from "./CustomerSlice";
import itemReducer from "./itemSlice"; // <-- IMPORT NEW SLICE

export const store = configureStore({
  reducer: {
    invoices: InvoiceReducer,
    customers: CustomerReducer,
    items: itemReducer, // <-- ADD NEW REDUCER
  },
});