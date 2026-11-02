import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { categoryAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const CategoryList = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  const editInputRef = useRef(null);

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-800';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';
  const inputText = isDark ? 'text-white' : 'text-gray-800';
  const tableHeadBg = isDark ? 'bg-gray-700' : 'bg-gray-50';
  const tableHover = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const divider = isDark ? 'divide-gray-700' : 'divide-gray-200';

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      if (response.data.success) {
        setCategories(response.data.data.categories);
      }
    } catch (error) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingId !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    setCreating(true);
    try {
      const response = await categoryAPI.create({ name });
      if (response.data.success) {
        toast.success('Category created successfully');
        setNewName('');
        fetchCategories();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create category';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleRename = async (id) => {
    const name = editingName.trim();
    if (!name) {
      toast.error('Category name cannot be empty');
      return;
    }

    const current = categories.find((c) => c.id === id);
    if (current && current.name === name) {
      cancelEditing();
      return;
    }

    setSaving(true);
    try {
      const response = await categoryAPI.update(id, { name });
      if (response.data.success) {
        toast.success('Category renamed successfully');
        cancelEditing();
        fetchCategories();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to rename category';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter') handleRename(id);
    if (e.key === 'Escape') cancelEditing();
  };

  const handleDelete = async (category) => {
    if (
      !window.confirm(
        `Delete category "${category.name}"?\n\nThis cannot be undone. Articles linked to this category must be re-assigned first.`
      )
    )
      return;

    try {
      const response = await categoryAPI.delete(category.id);
      if (response.data.success) {
        toast.success('Category deleted');
        fetchCategories();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete category';
      toast.error(message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-bold ${textClass}`}>Categories</h1>
          <span className={`text-sm ${textMuted}`}>{categories.length} total</span>
        </div>

        <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-5`}>
          <h2 className={`text-base font-semibold ${textClass} mb-3`}>Add New Category</h2>
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category name…"
              className={`flex-1 border ${inputBg} ${inputText} rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {creating ? 'Adding…' : '+ Add'}
            </button>
          </form>
        </div>

        <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} overflow-hidden`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p className={textMuted}>No categories yet. Add one above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={tableHeadBg}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider w-12`}>#</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Name</th>
                    <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider w-32`}>Articles</th>
                    <th className={`px-4 py-3 text-right text-xs font-medium ${textMuted} uppercase tracking-wider w-40`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${divider}`}>
                  {categories.map((category, index) => (
                    <tr key={category.id} className={`${tableHover} transition-colors`}>

                      <td className={`px-4 py-3 text-sm ${textMuted}`}>{index + 1}</td>

                      <td className="px-4 py-3">
                        {editingId === category.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, category.id)}
                              disabled={saving}
                              className={`border ${inputBg} ${inputText} rounded-lg px-2 py-1 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none w-full max-w-xs`}
                            />
                            <button
                              onClick={() => handleRename(category.id)}
                              disabled={saving}
                              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap"
                            >
                              {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={saving}
                              className={`${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} text-xs font-medium transition-colors`}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className={`${textClass} text-sm font-medium`}>{category.name}</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded font-medium ${parseInt(category.articleCount, 10) > 0
                            ? isDark
                              ? 'bg-blue-900/50 text-blue-300'
                              : 'bg-blue-100 text-blue-700'
                            : isDark
                              ? 'bg-gray-700 text-gray-400'
                              : 'bg-gray-100 text-gray-500'
                            }`}
                        >
                          {category.articleCount} article{parseInt(category.articleCount, 10) !== 1 ? 's' : ''}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {editingId === category.id ? null : (
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              onClick={() => startEditing(category)}
                              className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} text-sm font-medium transition-colors`}
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => handleDelete(category)}
                              disabled={parseInt(category.articleCount, 10) > 0}
                              title={
                                parseInt(category.articleCount, 10) > 0
                                  ? 'Re-assign or delete all articles first'
                                  : 'Delete category'
                              }
                              className={`text-sm font-medium transition-colors ${parseInt(category.articleCount, 10) > 0
                                ? 'opacity-30 cursor-not-allowed text-red-500'
                                : isDark
                                  ? 'text-red-400 hover:text-red-300'
                                  : 'text-red-600 hover:text-red-800'
                                }`}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CategoryList;

