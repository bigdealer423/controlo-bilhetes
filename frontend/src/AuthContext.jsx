// src/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("autenticado");
    setAutenticado(stored === "true");
  }, []);

  const login = () => {
    localStorage.setItem("autenticado", "true");
    setAutenticado(true);
  };

  const logout = () => {
    localStorage.removeItem("autenticado");
    setAutenticado(false);
  };

  return (
    <AuthContext.Provider value={{ autenticado, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
