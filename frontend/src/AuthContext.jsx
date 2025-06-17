import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [autenticado, setAutenticado] = useState(
    !!localStorage.getItem("utilizador")
  );

  const login = () => {
    localStorage.setItem("utilizador", "bigdealer");
    setAutenticado(true);
  };

  const logout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authExpires");
  setIsAuthenticated(false);
};

  return (
    <AuthContext.Provider value={{ autenticado, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
