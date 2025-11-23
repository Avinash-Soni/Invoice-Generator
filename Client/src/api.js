import axios from "axios";

// 1. Create an Axios instance
const apiClient = axios.create({
  baseURL: "http://localhost:8080", // Your backend URL
  withCredentials: true, // IMPORTANT: This sends the session cookie
});

// 2. Define the API methods
const api = {
  get: async (path) => {
    try {
      const response = await apiClient.get(path);
      return response.data; // Axios automatically returns JSON in 'data'
    } catch (error) {
      console.error("API GET Error:", error.response || error.message);
      throw error;
    }
  },

  post: async (path, body) => {
    try {
      const response = await apiClient.post(path, body); // 'body' is the 2nd arg
      return response.data;
    } catch (error) {
      console.error("API POST Error:", error.response || error.message);
      throw error;
    }
  },

  put: async (path, body) => {
    try {
      const response = await apiClient.put(path, body);
      return response.data;
    } catch (error) {
      console.error("API PUT Error:", error.response || error.message);
      throw error;
    }
  },

  // ✨ --- THIS IS THE FIX --- ✨
  // You MUST add this delete function.
  // Use quotes because 'delete' is a reserved keyword.
  'delete': async (path) => {
    try {
      const response = await apiClient.delete(path);
      return response.data;
    } catch (error) {
      console.error("API DELETE Error:", error.response || error.message);
      throw error;
    }
  },
};

export default api;