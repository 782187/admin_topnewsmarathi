import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { epaperAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const STATIC_URL = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
const buildStaticUrl = (filePath) => {
  if (!filePath) return '';
  const base = STATIC_URL.endsWith('/') ? STATIC_URL.slice(0, -1) : STATIC_URL;
  const path = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${base}${path}`;
};

const EpaperList = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [epapers, setEpapers] = useState([]);
  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ edition_id: '', is_published: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    epaperAPI.getEditions().then((res) => {
      if (res.data.success) setEditions(res.data.data.editions);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchEpapers();
  }, [pagination.page]);

  const fetchEpapers = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (filters.edition_id) params.edition_id = filters.edition_id;
      if (filters.is_published) params.is_published = filters.is_published;

      const response = await epaperAPI.getAll(params);
      if (response.data.success) {
        setEpapers(response.data.data.epapers);
        setPagination((prev) => ({
          ...prev,
          total: response.data.data.pagination.total,
          totalPages: response.data.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      toast.error(t('failedToFetchEpapers'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchEpapers();
  };

  const handleDelete = async (id) => {
    try {
      const response = await epaperAPI.delete(id);
      if (response.data.success) {
        toast.success(t('epaperDeleted'));
        setDeleteConfirm(null);
        fetchEpapers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('failedToFetchEpapers'));
      setDeleteConfirm(null);
    }
  };

  const handleTogglePublish = async (epaper) => {
    try {
      const formData = new FormData();
      formData.append('edition_id', epaper.edition_id);
      formData.append('publish_date', epaper.publish_date.slice(0, 10));
      formData.append('is_published', (!epaper.is_published).toString());
      const response = await epaperAPI.update(epaper.id, formData);
      if (response.data.success) {
        setEpapers((prev) => prev.map((e) => (e.id === epaper.id ? response.data.data.epaper : e)));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('failedToFetchEpapers'));
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('mr-IN', { year: 'numeric', month: 'short', day: 'numeric' });

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${textClass}`}>{t('epaperIssues')}</h1>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/epapers/editions"
              className={`px-4 py-2 border ${borderClass} ${textClass} rounded-lg ${tableRowHover} transition-colors`}
            >
              {t('epaperEditions')}
            </Link>
            <Link
              to="/admin/epapers/upload"
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + {t('uploadEpaper')}
            </Link>
          </div>
        </div>

        <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className={`block text-sm font-medium ${textLabel} mb-1`}>{t('edition')}</label>
              <select
                name="edition_id"
                value={filters.edition_id}
                onChange={handleFilterChange}
                className={`w-full border ${inputBg} ${inputText} rounded-lg px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
              >
                <option value="">{t('allEditions')}</option>
                {editions.map((ed) => (
                  <option key={ed.id} value={ed.id}>{ed.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className={`block text-sm font-medium ${textLabel} mb-1`}>{t('status')}</label>
              <select
                name="is_published"
                value={filters.is_published}
                onChange={handleFilterChange}
                className={`w-full border ${inputBg} ${inputText} rounded-lg px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
              >
                <option value="">{t('all')}</option>
                <option value="true">{t('published')}</option>
                <option value="false">{t('unpublished')}</option>
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

        <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} overflow-hidden`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : epapers.length === 0 ? (
            <div className="text-center py-12">
              <p className={textMuted}>{t('noEpapersFound')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={tableHeadBg}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('coverThumbnail')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('edition')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('publishDate')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('status')}</th>
                    <th className={`px-4 py-3 text-right text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dividerClass}`}>
                  {epapers.map((epaper) => (
                    <tr key={epaper.id} className={`${tableRowHover} transition-colors`}>
                      <td className="px-4 py-3">
                        {epaper.thumbnail_url ? (
                          <img src={buildStaticUrl(epaper.thumbnail_url)} alt={epaper.edition_name} className="w-14 h-20 object-cover rounded border border-gray-500/30" />
                        ) : (
                          <div className={`w-14 h-20 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded flex items-center justify-center text-xs ${textMuted}`}>
                            PDF
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className={`${textClass} text-sm font-medium`}>{epaper.edition_name}</p>
                        <a href={buildStaticUrl(epaper.pdf_url)} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs hover:underline">
                          {t('pdfFile')}
                        </a>
                      </td>
                      <td className={`px-4 py-3 text-sm ${textClass}`}>{formatDate(epaper.publish_date)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTogglePublish(epaper)}
                          className={`text-xs px-2 py-1 rounded font-medium ${
                            epaper.is_published
                              ? isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                              : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {epaper.is_published ? t('published') : t('unpublished')}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <Link
                            to={`/admin/epapers/edit/${epaper.id}`}
                            className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium transition-colors`}
                          >
                            {t('edit')}
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(epaper)}
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

          {pagination.totalPages > 1 && (
            <div className={`${tableHeadBg} px-4 py-3 flex items-center justify-between border-t ${borderClass}`}>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
                {t('showing')} {((pagination.page - 1) * pagination.limit) + 1} {t('to')} {Math.min(pagination.page * pagination.limit, pagination.total)} {t('of')} {pagination.total}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1.5 ${cardBg} border ${borderClass} ${textClass} rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed ${tableRowHover} transition-colors`}
                >
                  {t('previous')}
                </button>
                <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm py-1.5`}>
                  {t('page')} {pagination.page} {t('of')} {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
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

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg p-6 w-full max-w-md shadow-xl`}>
            <h3 className={`text-lg font-semibold ${textClass} mb-2`}>{t('confirmDelete')}</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              {t('deleteEpaperConfirm')} — <strong>{deleteConfirm.edition_name}</strong> ({formatDate(deleteConfirm.publish_date)})
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} border rounded-lg transition-colors`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default EpaperList;
