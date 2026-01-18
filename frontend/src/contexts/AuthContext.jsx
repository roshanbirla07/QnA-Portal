import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    // Retrieve the token from localStorage on app load
    return localStorage.getItem('token') || null;
  });
  
  const logoutUser = () => {
    Cookies.remove("authToken");
   
    setToken(null);
  };
 
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = payload.exp * 1000;

      const timer = setTimeout(() => {
        logoutUser();
      }, expirationTime - Date.now());

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
