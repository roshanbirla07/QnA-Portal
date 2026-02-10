import React, { useState } from 'react';
import { signupUser } from '../../../services/user.api';
import { SIGNUP_USER } from '../../../services/apis';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from "react-router-dom";



const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault(); 
    const formData = {
        email,
        password
    };
    signupUser("POST",SIGNUP_USER,formData, navigate, setToken);
    alert('Signup successful!');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary-blue/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-accent-pink/20 rounded-full blur-3xl"></div>
      </div>

      <div className="glass-card w-full max-w-md p-8 relative z-10 border border-white/10">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary-blue to-accent-pink bg-clip-text text-transparent">
          Sign Up
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-bg-secondary/50 border border-white/10 rounded-xl focus:outline-none focus:border-primary-blue text-text-primary transition-colors"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-bg-secondary/50 border border-white/10 rounded-xl focus:outline-none focus:border-primary-blue text-text-primary transition-colors"
              placeholder="Create a password"
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-3 px-4 bg-gradient-to-r from-primary-blue to-accent-pink text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity"
          >
            SIGN UP
          </button>
        </form>
        
        <div className="mt-6 text-center text-text-secondary">
           Already have an account? <Link to="/login" className="text-primary-blue hover:text-accent-pink transition-colors">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
