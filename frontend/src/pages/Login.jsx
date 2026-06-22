import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import axiosInstance from '../api/axiosInstance';
import { motion } from 'framer-motion';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axiosInstance.post('/api/auth/login', { username, password });
      const { token, ...userData } = res.data;
      login(userData, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#121212] rounded-xl p-8 shadow-2xl border border-white/5"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center font-bold text-black text-2xl shadow-[0_0_30px_rgba(29,185,84,0.3)] mb-4">
            M3
          </div>
          <h2 className="text-3xl font-bold text-white text-center tracking-tight">Log in to M3 Music</h2>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white">Email or username</label>
            <input 
              type="text" 
              className="bg-[#242424] border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
              placeholder="Email or username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-white">Password</label>
            <input 
              type="password" 
              className="bg-[#242424] border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 bg-primary text-black font-bold rounded-full py-3.5 hover:scale-105 active:scale-95 transition-transform flex justify-center disabled:opacity-70 disabled:hover:scale-100"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
