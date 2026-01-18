import React, { useState } from 'react';
import { loginUser } from '../services/user.api';
import { LOGIN_USER } from '../services/apis';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router";

const LoginPage = () => {
  const { setToken } = useAuth();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    const formData = {
        email,
        password
    };
    loginUser("POST",LOGIN_USER,formData, navigate, setToken);
    alert('Login submitted!');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        className="w-full max-w-sm bg-white p-6 shadow-lg rounded-md"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">
          Login
        </h2>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-600 mb-2"
          >
            Email
          </label>
          <input
            type="text"
            id="email"
            name="email"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-600 mb-2"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300"
        >
          Submit
        </button>
      </form>
      <div>Don't have Account ? <Link to="/signup">Signup</Link></div> 
    </div>
  );
};

export default LoginPage;
