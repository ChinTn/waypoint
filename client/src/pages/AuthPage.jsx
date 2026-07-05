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
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  
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
        const data = new FormData();
        data.append('fullName', formData.fullName);
        data.append('email', formData.email);
        data.append('password', formData.password);
        if (avatarFile) data.append('avatar', avatarFile);

        await register(data);
        setIsLogin(true);
        setFormData({ ...formData, password: '' });
        setAvatarFile(null);
        setAvatarPreview(null);
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
          className="w-full max-w-sm p-8 bg-white/40 dark:bg-neutral-950/40 backdrop-blur-md rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(0,0,0,0.3)]"
        >
          <div className="mb-10 text-center">
            <motion.div layoutId="logo-text">
              <h1 className="font-serif text-4xl text-slate-900 dark:text-white mb-2 tracking-tight">Waypoint</h1>
            </motion.div>
            <motion.p layout="position" className="text-sm font-bold text-blue-600 dark:text-[#60a5fa] font-sans tracking-[0.2em] uppercase">
              {isLogin ? 'Welcome Back' : 'Join Workspace'}
            </motion.p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400 text-xs font-sans text-center tracking-widest uppercase overflow-hidden"
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
                  className="space-y-4"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-500">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 text-center leading-tight">Add<br/>Photo</span>
                        )}
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setAvatarFile(file);
                            setAvatarPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required={!isLogin}
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-full text-base text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6] focus:bg-white dark:focus:bg-white/10 transition-all duration-300 placeholder-slate-400 dark:placeholder-neutral-500"
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
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-full text-base text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6] focus:bg-white dark:focus:bg-white/10 transition-all duration-300 placeholder-slate-400 dark:placeholder-neutral-500"
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
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-full text-base text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-[#3b82f6] focus:bg-white dark:focus:bg-white/10 transition-all duration-300 placeholder-slate-400 dark:placeholder-neutral-500"
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
              className="text-sm font-bold font-sans text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors tracking-[0.2em] uppercase"
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