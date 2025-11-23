import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(false); // false = not logged in

  useEffect(() => {
    // check session on mount
    axios
      .get("http://localhost:8080/check-session", { withCredentials: true })
      .then((res) => setUser(res.data.loggedIn))
      .catch(() => setUser(false));
  }, []);

  const logout = () => {
    axios
      .post("http://localhost:8080/logout", {}, { withCredentials: true })
      .then(() => setUser(false))
      .catch(() => setUser(false));
  };

  const login = () => setUser(true);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
