import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";


const OpenRoute = ({ children }) => {
  const { token } = useAuth();

  return !token ? children : <Navigate to="/" />;
};

export default OpenRoute;
