import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adsAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const AdList = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    placement: '',
    is_active: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchAds();
  }, [pagination.page]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.placement) params.placement = filters.placement;
      if (filters.is_active) params.is_active = filters.is_active;

      const response = await adsAPI.getAll(params);
      if (response.data.success) {
        setAds(response.data.data.ads);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          totalPages: response.data.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      toast.error(t('failedToFetchAdvertisements'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAds();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this advertisement?')) return;

    try {
      const response = await adsAPI.delete(id);
      if (response.data.success) {
        toast.success('Advertisement deleted successfully');
        fetchAds();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete advertisement';
      toast.error(message);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await adsAPI.toggleStatus(id);
      if (response.data.success) {
        toast.success(response.data.message);
        fetchAds();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to toggle status';
      toast.error(message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('mr-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-800';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const textLabel = isDark ? 'text-gray-300' : 'text-gray-700';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';
  const inputText = isDark ? 'text-white' : 'text-gray-800';
  const tableHeadBg = isDark ? 'bg-gray-700' : 'bg-gray-50';
  const tableRowHover = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const dividerClass = isDark ? 'divide-gray-700' : 'divide-gray-200';

  const placementLabels = {
    top_banner: t('topBanner'),
    sidebar: t('sidebar'),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${textClass}`}>{t('advertisements')}</h1>
          <Link
            to="/admin/ads/create"
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + {t('addNewAd')}
          </Link>
        </div>

        {/* Filters */}
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className={`block text-sm font-medium ${textLabel} mb-1`}>{t('placement')}</label>
              <select
                name="placement"
                value={filters.placement}
                onChange={handleFilterChange}
                className={`w-full border ${inputBg} ${inputText} rounded-lg px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
              >
                <option value="">{t('allPlacements')}</option>
                <option value="top_banner">{t('topBanner')}</option>
                <option value="sidebar">{t('sidebar')}</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className={`block text-sm font-medium ${textLabel} mb-1`}>{t('status')}</label>
              <select
                name="is_active"
                value={filters.is_active}
                onChange={handleFilterChange}
                className={`w-full border ${inputBg} ${inputText} rounded-lg px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
              >
                <option value="">{t('all')}</option>
                <option value="true">{t('active')}</option>
                <option value="false">{t('inactive')}</option>
              </select>
            </div>
            <button
              onClick={applyFilters}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {t('filter')}
            </button>
          </div>
        </div>

        {/* Ads Table */}
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} overflow-hidden`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-12">
              <p className={textMuted}>{t('noAdvertisementsFound')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={tableHeadBg}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('media')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('title')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('type')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('placement')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('duration')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('status')}</th>
                    <th className={`px-4 py-3 text-right text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dividerClass}`}>
                  {ads.map(ad => (
                    <tr key={ad.id} className={`${tableRowHover} transition-colors`}>
                      <td className="px-4 py-3">
                        {ad.type === 'image' ? (
                          <img
                            src={ad.media_url}
                            alt={ad.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className={`w-16 h-12 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded flex items-center justify-center`}>
                            <span className="text-red-500 text-lg">🎬</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className={`${textClass} text-sm font-medium line-clamp-2`}>{ad.title}</p>
                        {ad.redirect_url && (
                          <a href={ad.redirect_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs hover:underline">
                            {ad.redirect_url.substring(0, 30)}...
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm capitalize`}>{ad.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} text-xs px-2 py-1 rounded`}>
                          {placementLabels[ad.placement]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`${textMuted} text-xs`}>
                          {formatDate(ad.start_date)} -<br />
                          {formatDate(ad.end_date)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(ad.id)}
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            ad.is_active
                              ? isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                              : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {ad.is_active ? t('active') : t('inactive')}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <Link
                            to={`/admin/ads/edit/${ad.id}`}
                            className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium transition-colors`}
                          >
                            {t('edit')}
                          </Link>
                          <button
                            onClick={() => handleDelete(ad.id)}
                            className={`${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'} text-sm font-medium transition-colors`}
                          >
                            {t('delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className={`${tableHeadBg} px-4 py-3 flex items-center justify-between border-t ${borderClass}`}>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
                {t('showing')} {((pagination.page - 1) * pagination.limit) + 1} {t('to')} {Math.min(pagination.page * pagination.limit, pagination.total)} {t('of')} {pagination.total} {t('ads')}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1.5 ${cardBg} border ${borderClass} ${textClass} rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed ${tableRowHover} transition-colors`}
                >
                  {t('previous')}
                </button>
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm py-1.5`}>
                  {t('page')} {pagination.page} {t('of')} {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className={`px-3 py-1.5 ${cardBg} border ${borderClass} ${textClass} rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed ${tableRowHover} transition-colors`}
                >
                  {t('next')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdList;
