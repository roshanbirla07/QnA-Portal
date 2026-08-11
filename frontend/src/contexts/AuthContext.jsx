import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { decodeToken, isTokenExpired } from "../utils/auth";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    // Retrieve the token from localStorage on app load
    const storedToken = localStorage.getItem('token');
    return storedToken && !isTokenExpired(storedToken) ? storedToken : null;
  });
  
  const logoutUser = () => {
    Cookies.remove("authToken");
   
    setToken(null);
  };
 
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      const payload = decodeToken(token);
      if (!payload.exp) {
        logoutUser();
        return undefined;
      }
      const expirationTime = payload.exp * 1000;
      const delay = expirationTime - Date.now();
      if (delay <= 0) {
        logoutUser();
        return undefined;
      }

      const timer = setTimeout(() => {
        logoutUser();
      }, delay);

      return () => clearTimeout(timer); // Clear timer on unmount
    }
    else{
      localStorage.removeItem('token');
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, setToken, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
