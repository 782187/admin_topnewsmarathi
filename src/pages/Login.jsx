import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        toast.success('Login successful!');
        navigate('/admin/dashboard');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <video 
            src="/logo.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline
            className="h-20 sm:h-24 w-auto mx-auto mb-3 sm:mb-4 drop-shadow-lg"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">Sign in to manage your news portal</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#2a2a2a] rounded-lg shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all duration-200 text-sm"
                placeholder="admin@topnewsmarathi.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-[#1f1f1f] text-white rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all duration-200 text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-4 sm:mt-6 text-center">
            <Link 
              to="/admin/forgot-password" 
              className="text-gray-400 hover:text-red-500 text-sm transition-colors duration-200"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
