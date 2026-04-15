import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import toast from 'react-hot-toast';

const AdminLayout = ({ children, fullWidth = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { t, isMarathi, toggleLanguage } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('token');
      toast.success('Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      localStorage.removeItem('token');
      navigate('/admin/login');
    }
  };

  const menuItems = [
    { path: '/admin/dashboard', label: t('dashboard'), icon: 'home' },
    { path: '/admin/articles/list', label: t('articles'), icon: 'article' },
    { path: '/admin/articles/create', label: t('createArticle'), icon: 'add' },
    { path: '/admin/ads/list', label: t('advertisements'), icon: 'ads' },
    { path: '/admin/ads/create', label: t('createAd'), icon: 'addAd' },
  ];

  const isActive = (path) => location.pathname === path;

  const renderIcon = (icon) => {
    switch (icon) {
      case 'home':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'article':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      case 'add':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'ads':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h.217M18 6h.217a4 4 0 11-3.417 6.683" />
          </svg>
        );
      case 'addAd':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const bgClass = isDark ? 'bg-gray-900' : 'bg-gray-100';
  const sidebarBg = isDark ? 'bg-gray-800' : 'bg-white';
  const headerBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-800';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const sidebarText = isDark ? 'text-white' : 'text-gray-800';
  const headerText = isDark ? 'text-white' : 'text-gray-800';
  const sidebarHover = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const sidebarBorder = isDark ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 ${sidebarBg} shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center justify-center border-b ${sidebarBorder}`}>
          <video 
            src="/logo.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline
            className="h-10 w-auto drop-shadow-sm" 
          />
          <span className={`ml-2 ${sidebarText} font-bold text-lg`}>{t('admin')}</span>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-red-500 text-white'
                      : `${sidebarText} ${sidebarHover}`
                  }`}
                >
                  {renderIcon(item.icon)}
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${sidebarBorder}`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} rounded-lg ${sidebarHover} transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className={`h-16 ${headerBg} shadow-sm border-b ${borderClass} flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30`}>
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className={`lg:hidden p-2 rounded-lg ${hoverBg}`}
          >
            <svg className={`w-6 h-6 ${headerText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1" />

          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-lg ${hoverBg} relative`}
                title={`${t('notifications')} (${t('comingSoon')})`}
              >
                <svg className={`w-6 h-6 ${headerText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Notification badge placeholder */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className={`absolute right-0 mt-2 w-80 ${sidebarBg} rounded-lg shadow-lg border ${sidebarBorder} z-50`}>
                  <div className={`p-4 border-b ${sidebarBorder}`}>
                    <h3 className={`font-semibold ${sidebarText}`}>{t('notifications')}</h3>
                  </div>
                  <div className="p-4">
                    <p className={`${sidebarText} text-sm text-center py-8`}>
                      🔔 {t('firebaseNotifications')}<br/>{t('comingSoon')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className={`p-2 rounded-lg ${hoverBg}`}
              title={t('language')}
            >
              <span className={`text-lg font-bold ${headerText}`}>
                {isMarathi ? 'मराठी' : 'EN'}
              </span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${hoverBg}`}
              title={isDark ? t('switchToLight') : t('switchToDark')}
            >
              {isDark ? (
                <svg className={`w-6 h-6 ${headerText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className={`w-6 h-6 ${headerText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <span className={`${headerText} text-sm hidden sm:block`}>{t('welcome')}, Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className={`p-4 lg:p-6 ${fullWidth ? 'max-w-full' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
