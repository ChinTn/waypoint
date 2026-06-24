import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import Background from '../components/layout/Background';

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
        navigate('/dashboard');
      } else {
        await register(formData.fullName, formData.email, formData.password);
        setIsLogin(true);
        setFormData({ ...formData, password: '' });
      }
    } catch (err) {}
  };

  return (
    <Background>
      <div className="flex-1 w-full flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm p-8 bg-black/40 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)]"
        >
          <div className="mb-10 text-center">
            <motion.div layoutId="logo-text">
              <h1 className="font-serif text-4xl text-white mb-2 tracking-tight">Waypoint</h1>
            </motion.div>
            <motion.p layout="position" className="text-sm font-bold text-[#60a5fa] font-mono tracking-[0.2em] uppercase">
              {isLogin ? 'Welcome Back' : 'Join Workspace'}
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400 text-xs font-mono text-center tracking-widest uppercase overflow-hidden"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-full text-base text-white focus:outline-none focus:border-[#3b82f6] focus:bg-white/10 transition-all duration-300 placeholder:text-neutral-500"
                    placeholder="Full Name"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div layout="position">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-full text-base text-white focus:outline-none focus:border-[#3b82f6] focus:bg-white/10 transition-all duration-300 placeholder:text-neutral-500"
                placeholder="Email Address"
              />
            </motion.div>

            <motion.div layout="position">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-full text-base text-white focus:outline-none focus:border-[#3b82f6] focus:bg-white/10 transition-all duration-300 placeholder:text-neutral-500"
                placeholder="Password"
              />
            </motion.div>

            <motion.button
              layout="position"
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-8 bg-[#3b82f6] text-white font-sans font-semibold text-base tracking-widest py-4 rounded-full flex items-center justify-between px-6 transition-all duration-300 group disabled:opacity-50 shadow-[0_0_20px_rgba(255,90,0,0.3)] hover:shadow-[0_0_30px_rgba(255,90,0,0.5)]"
            >
              <span>{isLogin ? 'CONTINUE' : 'CREATE ACCOUNT'}</span>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </motion.button>
          </form>

          <motion.div layout="position" className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ fullName: '', email: '', password: '' });
                useAuthStore.setState({ error: null }); 
              }}
              className="text-sm font-bold font-mono text-neutral-400 hover:text-white transition-colors tracking-[0.2em] uppercase"
            >
              {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </Background>
  );
};

export default AuthPage;