import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  
  const navigate = useNavigate();
  const { login, register, isLoading, error } = useAuthStore();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/dashboard'); // Only navigate after successful login
      } else {
        await register(formData.fullName, formData.email, formData.password);
        // After registration, switch back to the login screen
        setIsLogin(true);
        // Clear the password field for security, but keep their email filled in!
        setFormData({ ...formData, password: '' });
      }
    } catch (err) {
      // Error is safely caught and displayed by Zustand
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4 selection:bg-[#ff5a00] selection:text-white">
      {/* Auth Container - Ultra Minimalist Solid Dark */}
      <div className="w-full max-w-md p-10 bg-neutral-900 border border-white/5 shadow-2xl">
        <div className="mb-12">
          <h1 className="font-serif text-5xl text-white mb-2 tracking-tight">
            ProjectFlow.
          </h1>
          <p className="text-[10px] text-[#ff5a00] font-mono tracking-[0.3em] uppercase">
            {isLogin ? 'System Authentication' : 'User Registration'}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/5 border-l-2 border-red-500 text-red-400 text-xs font-mono tracking-widest uppercase">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-[0.2em]">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required={!isLogin}
                className="w-full bg-neutral-950 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff5a00] transition-colors duration-300 placeholder:text-neutral-700"
                placeholder="Jane Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-[0.2em]">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-neutral-950 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff5a00] transition-colors duration-300 placeholder:text-neutral-700"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-neutral-500 mb-2 uppercase tracking-[0.2em]">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-neutral-950 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff5a00] transition-colors duration-300 placeholder:text-neutral-700"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-10 bg-[#ff5a00] hover:bg-[#e04f00] text-white font-sans font-medium text-sm tracking-widest py-4 flex items-center justify-between px-6 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isLogin ? 'LOG IN' : 'REGISTER'}</span>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
        </form>

        <div className="mt-12 text-left border-t border-white/5 pt-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setFormData({ fullName: '', email: '', password: '' });
              useAuthStore.setState({ error: null }); 
            }}
            className="text-[10px] font-mono text-neutral-400 hover:text-white transition-colors tracking-[0.2em] uppercase flex items-center group"
          >
            <span className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#ff5a00]">-</span> 
            {isLogin ? 'Create a new account' : 'Back to Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;