
import React, { useState } from 'react';
import { db } from '../services/mockDb';
import { User } from '../types';
import { notify } from '../services/events';

interface LoginProps {
  onLogin: (user: User) => void;
  appName?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, appName }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', email: '', phone: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegister) {
      if(formData.phone.length !== 10) {
        notify("Phone number must be exactly 10 digits", "error");
        return;
      }
      const res = db.register(formData.username, formData.email, formData.password, formData.phone);
      if (typeof res === 'string') {
          notify(res, "error");
      } else {
          notify("Account Created!", "success");
          onLogin(res);
      }
    } else {
      const user = db.login(formData.username, formData.password);
      if (user) {
          notify("Welcome back!", "success");
          onLogin(user);
      } else {
          notify("Invalid credentials", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-accent rounded-full mx-auto flex items-center justify-center text-4xl text-primary mb-4 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
            <i className="fa-solid fa-trophy"></i>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight italic">{appName || "Tourna NP"}</h1>
          <p className="text-gray-400 text-sm mt-1">Nepal's #1 E-Sports Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-secondary p-6 rounded-2xl border border-gray-800 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-2 text-center border-b border-gray-700 pb-3">
            {isRegister ? 'Create Account' : 'Player Login'}
          </h2>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">Username / Phone</label>
            <input 
              required
              type="text" 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all placeholder-gray-600"
              placeholder={isRegister ? "Choose a username" : "Username or Phone"}
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">Email</label>
                <input 
                  required
                  type="email" 
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all placeholder-gray-600"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">Mobile Number (10 Digits)</label>
                <input 
                  required
                  type="tel"
                  maxLength={10} 
                  pattern="[0-9]{10}"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all placeholder-gray-600"
                  placeholder="98XXXXXXXX"
                  value={formData.phone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g,'');
                    setFormData({...formData, phone: val});
                  }}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">Password</label>
            <input 
              required
              type="password" 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all placeholder-gray-600"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-black font-bold py-3.5 rounded-lg transition-all transform active:scale-95 shadow-lg mt-4">
            {isRegister ? 'Sign Up' : 'Login Now'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-8 text-sm">
          {isRegister ? 'Already have an account?' : "New Player?"}{' '}
          <button onClick={() => setIsRegister(!isRegister)} className="text-accent font-bold hover:underline">
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
