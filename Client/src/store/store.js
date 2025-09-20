import { configureStore } from "@reduxjs/toolkit"
import InvoiceReducer from "./InvoiceSlice"

export const store = configureStore({
    reducer: {
        invoices: InvoiceReducer,
        
    }
})