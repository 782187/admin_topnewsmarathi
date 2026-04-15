import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchAdmin();
  }, []);

  const fetchAdmin = async () => {
    try {
      const response = await authAPI.getMe();
      if (response.data.success) {
        setAdmin(response.data.data.admin);
      }
    } catch (error) {
      toast.error('Session expired');
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await authAPI.changePassword(passwordData);
      if (response.data.success) {
        toast.success('Password changed successfully');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setShowChangePassword(false);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-800';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';
  const inputText = isDark ? 'text-white' : 'text-gray-800';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <h1 className={`text-2xl font-bold ${textClass}`}>{t('dashboard')}</h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/admin/articles/create"
            className="bg-red-500 hover:bg-red-600 rounded-lg p-6 transition-colors shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-lg p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{t('createArticle')}</h3>
                <p className="text-white/70 text-sm">{t('addNewArticle')}</p>
              </div>
            </div>
          </Link>

          <Link
            to="/admin/articles/list"
            className={`${cardBg} hover:${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${borderClass} rounded-lg p-6 transition-colors shadow-sm`}
          >
            <div className="flex items-center space-x-4">
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3`}>
                <svg className={`w-6 h-6 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div>
                <h3 className={`${textClass} font-semibold text-lg`}>{t('manageArticles')}</h3>
                <p className={`${textMuted} text-sm`}>{t('viewEditDeleteArticles')}</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Account Info */}
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-6`}>
          <h2 className={`text-lg font-semibold ${textClass} mb-4`}>{t('accountInfo')}</h2>
          <div className="space-y-3">
            <div className={`flex items-center justify-between py-2 border-b ${borderClass}`}>
              <span className={textMuted}>{t('email')}</span>
              <span className={`${textClass} font-medium`}>{admin?.username}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className={textMuted}>{t('created')}</span>
              <span className={textClass}>
                {admin?.created_at ? new Date(admin.created_at).toLocaleDateString('mr-IN') : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${textClass}`}>{t('security')}</h2>
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="text-red-500 hover:text-red-600 text-sm font-medium"
            >
              {showChangePassword ? t('cancel') : t('changePassword')}
            </button>
          </div>

          {showChangePassword && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>{t('currentPassword')}</label>
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  required
                  className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>{t('newPassword')}</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-1`}>{t('confirmNewPassword')}</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                />
              </div>
              <button
                type="submit"
                disabled={passwordLoading}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {passwordLoading ? t('updating') : t('updatePassword')}
              </button>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
