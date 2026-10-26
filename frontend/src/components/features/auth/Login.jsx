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
    <div className="auth-page">
      <div className="surface-card auth-card">
        <h1 className="text-3xl font-bold text-center mb-8">
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

          <button type="submit" className="btn-primary w-full">
            LOGIN
          </button>
        </form>

        <div className="mt-6 text-center text-text-secondary">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-primary-blue hover:underline">
            Signup
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
