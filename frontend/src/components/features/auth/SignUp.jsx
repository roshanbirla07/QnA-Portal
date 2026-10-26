import React, { useState } from 'react';
import { signupUser } from '../../../services/user.api';
import { SIGNUP_USER } from '../../../services/apis';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      email,
      password
    };

    try {
      const response = await signupUser("POST", SIGNUP_USER, formData, navigate, setToken);
      toast.success(response.message || "Signup successful");
    } catch (error) {
      toast.error(error.message || "Unable to signup");
    }
  };

  return (
    <div className="auth-page">
      <div className="surface-card auth-card">
        <h1 className="text-3xl font-bold text-center mb-8">
          Sign Up
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-text-secondary mb-2">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-text-secondary mb-2">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              placeholder="Create a password"
            />
          </div>
          
          <button
            type="submit"
            className="btn-primary w-full"
          >
            SIGN UP
          </button>
        </form>
        
        <div className="mt-6 text-center text-text-secondary">
           Already have an account? <Link to="/login" className="text-primary-blue hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
