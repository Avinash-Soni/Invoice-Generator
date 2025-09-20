import React from "react"
import AppContent from "./AppContent"
import { Provider } from "react-redux"
import { store } from "../../store/store"

function InvoiceStart() {

  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default InvoiceStart;
