import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authorAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const AuthorList = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [authorName, setAuthorName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-800';
  const textLabel = isDark ? 'text-gray-300' : 'text-gray-700';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';
  const inputText = isDark ? 'text-white' : 'text-gray-800';
  const rowHover = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const tableHeader = isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600';

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const response = await authorAPI.getAll();
      if (response.data.success) {
        setAuthors(response.data.data.authors);
      }
    } catch (error) {
      toast.error(t('failedToFetchAuthors'));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingAuthor(null);
    setAuthorName('');
    setShowModal(true);
  };

  const openEditModal = (author) => {
    setEditingAuthor(author);
    setAuthorName(author.name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAuthor(null);
    setAuthorName('');
  };

  const handleSave = async () => {
    if (!authorName.trim()) {
      toast.error(t('authorNameRequired'));
      return;
    }
    setSaving(true);
    try {
      if (editingAuthor) {
        const response = await authorAPI.update(editingAuthor.id, { name: authorName.trim() });
        if (response.data.success) {
          toast.success(t('authorUpdated'));
          setAuthors(prev => prev.map(a => a.id === editingAuthor.id ? response.data.data.author : a));
          closeModal();
        }
      } else {
        const response = await authorAPI.create({ name: authorName.trim() });
        if (response.data.success) {
          toast.success(t('authorCreated'));
          setAuthors(prev => [...prev, response.data.data.author]);
          closeModal();
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || t('failedToSaveAuthor');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (author) => {
    try {
      const response = await authorAPI.delete(author.id);
      if (response.data.success) {
        toast.success(t('authorDeleted'));
        setAuthors(prev => prev.filter(a => a.id !== author.id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      const message = error.response?.data?.message || t('failedToDeleteAuthor');
      toast.error(message);
      setDeleteConfirm(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${textClass}`}>{t('authors')}</h1>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('addNewAuthor')}
          </button>
        </div>

        {/* Table */}
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} overflow-hidden`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className={tableHeader}>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">{t('authorName')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">{t('date')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {authors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={`px-6 py-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t('noAuthorsFound')}
                    </td>
                  </tr>
                ) : (
                  authors.map((author, idx) => (
                    <tr key={author.id} className={`${rowHover} transition-colors`}>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{idx + 1}</td>
                      <td className={`px-6 py-4 text-sm font-medium ${textClass}`}>{author.name}</td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(author.created_at).toLocaleDateString('mr-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(author)}
                            className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            {t('edit')}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(author)}
                            className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            {t('delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg p-6 w-full max-w-md shadow-xl`}>
            <h3 className={`text-lg font-semibold ${textClass} mb-4`}>
              {editingAuthor ? t('editAuthor') : t('addNewAuthor')}
            </h3>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={t('enterAuthorName')}
              className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none mb-4`}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} border rounded-lg hover:${isDark ? 'bg-gray-600' : 'bg-gray-200'} transition-colors`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {saving ? t('saving') : (editingAuthor ? t('updateAuthor') : t('addAuthor'))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg p-6 w-full max-w-md shadow-xl`}>
            <h3 className={`text-lg font-semibold ${textClass} mb-2`}>{t('confirmDelete')}</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              {t('deleteAuthorConfirm')} <strong>{deleteConfirm.name}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} border rounded-lg transition-colors`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
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

export default AuthorList;
