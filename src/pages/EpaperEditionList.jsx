import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { epaperAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const EpaperEditionList = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEdition, setEditingEdition] = useState(null);
  const [name, setName] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
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
    fetchEditions();
  }, []);

  const fetchEditions = async () => {
    try {
      setLoading(true);
      const response = await epaperAPI.getEditions();
      if (response.data.success) {
        setEditions(response.data.data.editions);
      }
    } catch (error) {
      toast.error(t('failedToFetchEditions'));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingEdition(null);
    setName('');
    setDisplayOrder(editions.length);
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (edition) => {
    setEditingEdition(edition);
    setName(edition.name);
    setDisplayOrder(edition.display_order);
    setIsActive(!!edition.is_active);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEdition(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('editionName'));
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), display_order: displayOrder, is_active: isActive };
      if (editingEdition) {
        const response = await epaperAPI.updateEdition(editingEdition.id, payload);
        if (response.data.success) {
          toast.success(t('editionSaved'));
          fetchEditions();
          closeModal();
        }
      } else {
        const response = await epaperAPI.createEdition(payload);
        if (response.data.success) {
          toast.success(t('editionSaved'));
          fetchEditions();
          closeModal();
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || t('failedToFetchEditions');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (edition) => {
    try {
      const response = await epaperAPI.deleteEdition(edition.id);
      if (response.data.success) {
        toast.success(t('editionDeleted'));
        setEditions((prev) => prev.filter((e) => e.id !== edition.id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      const message = error.response?.data?.message || t('failedToFetchEditions');
      toast.error(message);
      setDeleteConfirm(null);
    }
  };

  const handleToggleActive = async (edition) => {
    try {
      const response = await epaperAPI.updateEdition(edition.id, {
        name: edition.name,
        display_order: edition.display_order,
        is_active: !edition.is_active,
      });
      if (response.data.success) {
        setEditions((prev) => prev.map((e) => (e.id === edition.id ? response.data.data.edition : e)));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('failedToFetchEditions'));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${textClass}`}>{t('epaperEditions')}</h1>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/epapers/list"
              className={`px-4 py-2 border ${borderClass} ${textClass} rounded-lg ${rowHover} transition-colors`}
            >
              {t('epaperIssues')}
            </Link>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('addEdition')}
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={tableHeader}>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">{t('displayOrder')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">{t('editionName')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">{t('issueCount')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">{t('latestIssue')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">{t('status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {editions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={`px-6 py-10 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('noEditionsFound')}
                      </td>
                    </tr>
                  ) : (
                    editions.map((edition) => (
                      <tr key={edition.id} className={`${rowHover} transition-colors`}>
                        <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{edition.display_order}</td>
                        <td className={`px-6 py-4 text-sm font-medium ${textClass}`}>{edition.name}</td>
                        <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{edition.issueCount}</td>
                        <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {edition.latestPublishDate ? new Date(edition.latestPublishDate).toLocaleDateString('mr-IN') : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(edition)}
                            className={`text-xs px-2 py-1 rounded font-medium ${
                              edition.is_active
                                ? isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'
                                : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {edition.is_active ? t('active') : t('inactive')}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(edition)}
                              className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              {t('edit')}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(edition)}
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
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg p-6 w-full max-w-md shadow-xl`}>
            <h3 className={`text-lg font-semibold ${textClass} mb-5`}>
              {editingEdition ? t('editEdition') : t('addEdition')}
            </h3>

            <label className={`block text-sm font-medium ${textLabel} mb-2`}>{t('editionName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={t('enterEditionName')}
              className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none mb-4`}
            />

            <label className={`block text-sm font-medium ${textLabel} mb-2`}>{t('displayOrder')}</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none mb-4`}
            />

            <label className="relative inline-flex items-center cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500`}></div>
              <span className={`ml-3 ${textLabel} text-sm font-medium`}>{isActive ? t('active') : t('inactive')}</span>
            </label>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} border rounded-lg transition-colors`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {saving ? t('saving') : (editingEdition ? t('edit') : t('addEdition'))}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg p-6 w-full max-w-md shadow-xl`}>
            <h3 className={`text-lg font-semibold ${textClass} mb-2`}>{t('confirmDelete')}</h3>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              {t('deleteEditionConfirm')} <strong>{deleteConfirm.name}</strong>
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

export default EpaperEditionList;
