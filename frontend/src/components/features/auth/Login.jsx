import React, { useState } from "react";
import { loginUser } from "../../../services/user.api";
import { LOGIN_USER } from "../../../services/apis";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import toast from "react-hot-toast";

const LoginPage = () => {
  const { setToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await loginUser("POST", LOGIN_USER, { email, password }, navigate, setToken);
      toast.success(response.message || "Login successful");
    } catch (error) {
      toast.error(error.message || "Unable to login");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-primary relative overflow-hidden px-4">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary-purple/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-primary-blue/20 rounded-full blur-3xl" />
      </div>

      <div className="glass-card w-full max-w-md p-8 relative z-10 border border-white/10">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary-purple to-primary-blue bg-clip-text text-transparent">
          Login
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="input-field"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="input-field"
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
          </div>

          <button type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-primary-purple to-primary-blue text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity">
            LOGIN
          </button>
        </form>

        <div className="mt-6 text-center text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-primary-blue hover:text-accent-pink transition-colors">
            Signup
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
