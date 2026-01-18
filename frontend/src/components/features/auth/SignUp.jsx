import React, { useState } from 'react';
import { signupUser } from '../services/user.api';
import { SIGNUP_USER } from '../services/apis';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


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
    alert('Login submitted!');
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div
        style={{
          width: '400px',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          Signup
        </h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 'bold', display: 'block' }}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                marginTop: '0.5rem',
                fontSize: '1rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 'bold', display: 'block' }}>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                marginTop: '0.5rem',
                fontSize: '1rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.8rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#fff',
              backgroundColor: '#007BFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            Signup
          </button>
        </form>
        
      </div>
    </div>
  );
};

export default Signup;
