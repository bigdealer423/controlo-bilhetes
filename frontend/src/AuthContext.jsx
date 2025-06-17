// AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const expires = parseInt(localStorage.getItem("authExpires") || "0", 10);
    const agora = new Date().getTime();

    if (token && agora < expires) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const login = () => {
    const duracao = 60 * 60 * 1000; // 1 hora
    const expiraEm = new Date().getTime() + duracao;

    localStorage.setItem("authToken", "true");
    localStorage.setItem("authExpires", expiraEm.toString());
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authExpires");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
