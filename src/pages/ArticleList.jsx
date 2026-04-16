import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { articleAPI, categoryAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const ArticleList = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    type: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, [pagination.page]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      if (response.data.success) {
        setCategories(response.data.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.category) params.category = filters.category;
      if (filters.type) params.type = filters.type;

      const response = await articleAPI.getAll(params);
      if (response.data.success) {
        setArticles(response.data.data.articles);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination.total,
          totalPages: response.data.data.pagination.totalPages,
        }));
      }
    } catch (error) {
      toast.error('Failed to fetch articles');
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
    fetchArticles();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;

    try {
      const response = await articleAPI.delete(id);
      if (response.data.success) {
        toast.success('Article deleted successfully');
        fetchArticles();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete article';
      toast.error(message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('mr-IN', {
      year: 'numeric',
      month: 'long',
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${textClass}`}>{t('articles')}</h1>
          <Link
            to="/admin/articles/create"
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + {t('addNewArticle')}
          </Link>
        </div>

        {/* Filters */}
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className={`block text-sm font-medium ${textLabel} mb-1`}>{t('category')}</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className={`w-full border ${inputBg} ${inputText} rounded-lg px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
              >
                <option value="">{t('allCategories')}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className={`block text-sm font-medium ${textLabel} mb-1`}>{t('articleType')}</label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className={`w-full border ${inputBg} ${inputText} rounded-lg px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
              >
                <option value="">{t('allTypes')}</option>
                <option value="article">{t('article')}</option>
                <option value="video">{t('video')}</option>
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

        {/* Articles Table */}
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} overflow-hidden`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <p className={textMuted}>{t('noDataFound')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={tableHeadBg}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('thumbnail')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('title')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('category')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('city')}</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('type')}</th>

                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('date')}</th>
                    <th className={`px-4 py-3 text-right text-xs font-medium ${textMuted} uppercase tracking-wider`}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dividerClass}`}>
                  {articles.map(article => (
                    <tr key={article.id} className={`${tableRowHover} transition-colors`}>
                      <td className="px-4 py-3">
                        {article.thumbnail ? (
                            <img
                              src={`${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}${article.thumbnail}`}
                              alt={article.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className={`w-16 h-12 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded flex items-center justify-center`}>
                            <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs`}>No img</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className={`${textClass} text-sm font-medium line-clamp-2`}>{article.title}</p>
                        {article.youtube_url && (
                          <span className="text-red-500 text-xs">🎬 {t('videoArticle')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{article.category_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{article.city_name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        {article.type === 'video' ? (
                          <span className={`${isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'} text-xs px-2 py-1 rounded font-medium`}>{t('video')}</span>
                        ) : (
                          <span className={`${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-700'} text-xs px-2 py-1 rounded font-medium`}>{t('article')}</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className={textMuted}>{formatDate(article.created_at)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <Link
                            to={`/admin/articles/edit/${article.id}`}
                            className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium transition-colors`}
                          >
                            {t('edit')}
                          </Link>
                          <button
                            onClick={() => handleDelete(article.id)}
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
                {t('showing')} {((pagination.page - 1) * pagination.limit) + 1} {t('to')} {Math.min(pagination.page * pagination.limit, pagination.total)} {t('of')} {pagination.total} {t('articles').toLowerCase()}
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

export default ArticleList;
