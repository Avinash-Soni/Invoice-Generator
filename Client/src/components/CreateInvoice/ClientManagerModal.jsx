import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addCustomer, deleteCustomer } from "../../store/CustomerSlice";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, Plus, Loader2 } from "lucide-react";

// --- STYLING --- (Unchanged)
const labelClass = "block text-sm font-medium text-gray-700 mb-1";
const inputClass =
  "w-full bg-white/60 border border-gray-300/70 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-[#0ea5a4] focus:border-[#0ea5a4] placeholder:text-gray-400 shadow-sm transition-colors backdrop-blur-sm";

// --- ANIMATION VARIANTS --- (Unchanged)
const modalVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, y: 50, scale: 0.9, transition: { duration: 0.2 } },
};
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

function ClientManagerModal({ onClose }) {
  const dispatch = useDispatch();
  const { customers } = useSelector((state) => state.customers);
  const [newClient, setNewClient] = useState({
    name: "",
    clientEmail: "",
    streetAddress: "",
    city: "",
    postCode: "",
    country: "",
    gstin: "",
  });
  const [loading, setLoading] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  // --- All Logic (Unchanged) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClient.name.trim()) return;
    setLoading("add");
    await dispatch(addCustomer(newClient));
    setNewClient({
      name: "",
      clientEmail: "",
      streetAddress: "",
      city: "",
      postCode: "",
      country: "",
      gstin: "",
    });
    setLoading(null);
  };

  const handleDeleteClient = async (id) => {
    setLoading(`delete-${id}`);
    await dispatch(deleteCustomer(id));
    setLoading(null);
    setConfirmingDeleteId(null);
  };
  // --- End of Unchanged Logic ---

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4 z-[60]">
        {/* --- MODIFIED: Added border-2 border-black --- */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-slate-100 rounded-2xl border-2 border-black shadow-2xl p-6 md:p-8 w-full max-w-4xl my-8 text-slate-900"
        >
          {/* --- HEADER (Unchanged) --- */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] bg-clip-text text-transparent">
              Manage Clients
            </h2>
            <motion.button
              whileHover={{ scale: 1.1, color: "#ef4444" }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-gray-500"
            >
              <X size={28} />
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* --- ADD NEW CLIENT FORM (with your label changes) --- */}
            <form
              onSubmit={handleAddClient}
              className="space-y-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
            >
              <h3 className="text-xl font-bold text-[#056b66]">Add New Client</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label>
                  <span className={labelClass}>
                    Client Name <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={newClient.name}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </label>
                <label>
                  <span className={labelClass}>Client Email</span>
                  <input
                    type="email"
                    name="clientEmail"
                    value={newClient.clientEmail}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </label>
              </div>
              <label>
                {/* Your label change */}
                <span className={labelClass}>Address</span>
                <input
                  type="text"
                  name="streetAddress"
                  value={newClient.streetAddress}
                  onChange={handleChange}
                  className={inputClass}
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label>
                  <span className={labelClass}>City</span>
                  <input
                    type="text"
                    name="city"
                    value={newClient.city}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </label>
                <label>
                  {/* Your label change */}
                  <span className={labelClass}>Mobile Number</span>
                  <input
                    type="text"
                    name="postCode"
                    value={newClient.postCode}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label>
                  <span className={labelClass}>Country</span>
                  <input
                    type="text"
                    name="country"
                    value={newClient.country}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </label>
                <label>
                  {/* Your label change */}
                  <span className={labelClass}>GST No.</span>
                  <input
                    type="text"
                    name="gstin"
                    value={newClient.gstin}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </label>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading === "add"}
                className="w-full bg-gradient-to-r from-[#0ea5a4] to-[#0bd1c5] hover:from-[#056b66] hover:to-[#0ea5a4] rounded-full p-3 flex items-center justify-center text-white font-semibold shadow-lg gap-2 transition-all disabled:opacity-50"
              >
                {loading === "add" ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Plus size={20} />
                )}
                <span>Add Client</span>
              </motion.button>
            </form>

            {/* --- EXISTING CLIENTS LIST (Unchanged) --- */}
            <div className="space-y-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold text-[#056b66]">
                Existing Clients
              </h3>
              <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                <AnimatePresence>
                  {customers.length === 0 && (
                    <p className="text-gray-500 text-sm">No clients found.</p>
                  )}
                  {customers.map((client) => (
                    <motion.div
                      key={client.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="flex justify-between items-center p-3 rounded-lg border border-gray-200 hover:bg-slate-100 transition-colors"
                    >
                      <span className="font-medium">{client.name}</span>
                      <motion.button
                        whileHover={{ scale: 1.1, color: "#ef4444" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setConfirmingDeleteId(client.id)}
                        disabled={!!loading}
                        className="text-gray-500 disabled:opacity-50"
                      >
                        {loading === `delete-${client.id}` ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* --- DELETE CONFIRMATION POP-UP (Unchanged) --- */}
      <AnimatePresence>
        {confirmingDeleteId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70]">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl border border-red-300 shadow-2xl p-6 md:p-8 w-full max-w-md"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-700">
                  Confirm Deletion
                </h2>
              </div>

              <p className="mb-6 text-slate-700">
                Are you sure you want to delete this client?
                <br />
                <span className="font-semibold">
                  All related ledger entries will also be permanently deleted.
                </span>
                This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmingDeleteId(null)}
                  disabled={loading === `delete-${confirmingDeleteId}`}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full font-semibold"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDeleteClient(confirmingDeleteId)}
                  disabled={loading === `delete-${confirmingDeleteId}`}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold flex items-center gap-2"
                >
                  {loading === `delete-${confirmingDeleteId}` ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                  <span>Yes, Delete</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ClientManagerModal;