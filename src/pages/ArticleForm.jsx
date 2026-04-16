import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { articleAPI, categoryAPI, cityAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { convertToEmbedUrl, extractYouTubeInfo, isYouTubeUrl } from '../utils/videoUtils.js';

// Quill toolbar configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'color': [] }],
    ['link'],
    ['clean'],
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline',
  'list', 'bullet',
  'color',
  'link',
];

const ArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    city_id: '',
    type: 'article',
    video_url: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchCities();
    if (isEdit) {
      fetchArticle();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      if (response.data.success) {
        setCategories(response.data.data.categories);
      }
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const fetchCities = async () => {
    try {
      const response = await cityAPI.getAll();
      if (response.data.success) {
        setCities(response.data.data.cities);
      }
    } catch (error) {
      toast.error('Failed to fetch cities');
    }
  };

  const fetchArticle = async () => {
    try {
      setLoading(true);
      // We need to get article by ID, but our API uses slug. Let's use the list and find
      const response = await articleAPI.getAll({ limit: 1000 });
      const article = response.data.data.articles.find(a => a.id === parseInt(id));
      
      if (!article) {
        toast.error('Article not found');
        navigate('/admin/articles/list');
        return;
      }

      setFormData({
        title: article.title,
        content: article.content,
        category_id: article.category_id.toString(),
        city_id: article.city_id?.toString() || '',
        type: article.type || 'article',
        video_url: article.video_url || '',
      });

      if (article.thumbnail) {
        setThumbnailPreview(`${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}${article.thumbnail}`);
      }
    } catch (error) {
      toast.error('Failed to fetch article');
      navigate('/admin/articles/list');
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const response = await categoryAPI.create({ name: newCategoryName.trim() });
      if (response.data.success) {
        toast.success('Category created');
        setCategories(prev => [...prev, response.data.data.category]);
        setFormData(prev => ({ ...prev, category_id: response.data.data.category.id.toString() }));
        setShowCategoryModal(false);
        setNewCategoryName('');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create category';
      toast.error(message);
    }
  };

  const handleAddCity = async () => {
    if (!newCityName.trim()) {
      toast.error('City name is required');
      return;
    }

    try {
      const response = await cityAPI.create({ name: newCityName.trim() });
      if (response.data.success) {
        toast.success('City created');
        setCities(prev => [...prev, response.data.data.city]);
        setFormData(prev => ({ ...prev, city_id: response.data.data.city.id.toString() }));
        setShowCityModal(false);
        setNewCityName('');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create city';
      toast.error(message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }

    if (!formData.category_id) {
      toast.error('Category is required');
      return;
    }

    // Validate video_url if type is video
    if (formData.type === 'video' && !formData.video_url.trim()) {
      toast.error(t('videoUrlRequired'));
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('content', formData.content);
      data.append('category_id', formData.category_id);
      if (formData.city_id) data.append('city_id', formData.city_id);
      data.append('type', formData.type || 'article');
      if (formData.video_url) data.append('video_url', formData.video_url);
      if (thumbnailFile) data.append('thumbnail', thumbnailFile);

      if (isEdit) {
        const response = await articleAPI.update(id, data);
        if (response.data.success) {
          toast.success('Article updated successfully');
          navigate('/admin/articles/list');
        }
      } else {
        const response = await articleAPI.create(data);
        if (response.data.success) {
          toast.success('Article created successfully');
          navigate('/admin/articles/list');
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} article`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === parseInt(formData.category_id));
  const showCityDropdown = selectedCategory?.name === 'शहरे';
  const { isDark } = useTheme();

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-800';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const textLabel = isDark ? 'text-gray-300' : 'text-gray-700';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';
  const inputText = isDark ? 'text-white' : 'text-gray-800';

  if (loading && isEdit) {
    return (
      <AdminLayout fullWidth>
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
    <AdminLayout fullWidth>
      <div className="space-y-6">
        {/* Page Header */}
        <h1 className={`text-2xl font-bold ${textClass}`}>{isEdit ? 'Edit Article' : t('createArticle')}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
            <label className={`block text-sm font-medium ${textLabel} mb-2`}>
              {t('title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('enterTitle')}
              className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
            />
          </div>

          {/* Thumbnail */}
          <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
            <label className={`block text-sm font-medium ${textLabel} mb-2`}>
              {t('thumbnail')} (Max 2MB)
            </label>
            <div className="flex items-start space-x-4">
              {thumbnailPreview && (
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-32 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className={`w-full ${textMuted} file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-500 file:text-white file:cursor-pointer hover:file:bg-red-600 transition-colors`}
                />
                <p className={`${textMuted} text-xs mt-1`}>{t('supportedFormats')}</p>
              </div>
            </div>
          </div>

          {/* Category & City */}
          <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${textLabel} mb-2`}>
                  {t('category')} <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className={`flex-1 border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                  >
                    <option value="">{t('selectCategory')}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} border rounded-lg hover:${isDark ? 'bg-gray-600' : 'bg-gray-200'} transition-colors`}
                  >
                    +
                  </button>
                </div>
              </div>

              {showCityDropdown && (
                <div>
                  <label className={`block text-sm font-medium ${textLabel} mb-2`}>
                    {t('city')}
                  </label>
                  <div className="flex space-x-2">
                    <select
                      name="city_id"
                      value={formData.city_id}
                      onChange={handleChange}
                      className={`flex-1 border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                    >
                      <option value="">{t('selectCity')}</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCityModal(true)}
                      className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} border rounded-lg hover:${isDark ? 'bg-gray-600' : 'bg-gray-200'} transition-colors`}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Article Type, Video URL, Featured, Priority */}
          <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Article Type */}
              <div>
                <label className={`block text-sm font-medium ${textLabel} mb-2`}>
                  {t('articleType')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                >
                  <option value="article">{t('article')}</option>
                  <option value="video">{t('video')}</option>
                </select>
              </div>

              {/* Video URL (shown when type is video) */}
              {formData.type === 'video' && (
                <div>
                  <label className={`block text-sm font-medium ${textLabel} mb-2`}>
                    {t('videoUrl')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleChange}
                    placeholder={t('enterVideoUrl')}
                    className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                  />
                  
                  {/* YouTube Preview */}
                  {formData.video_url && isYouTubeUrl(formData.video_url) && (
                    <div className="mt-4">
                      <p className={`${textMuted} text-sm mb-2`}>Video Preview:</p>
                      <div className="relative rounded-lg overflow-hidden bg-black">
                        <iframe
                          src={convertToEmbedUrl(formData.video_url)}
                          className="w-full h-64"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      {(() => {
                        const info = extractYouTubeInfo(formData.video_url);
                        return info && info.startTime > 0 ? (
                          <p className={`${textMuted} text-xs mt-2`}>
                            Video starts at {Math.floor(info.startTime / 60)}:{(info.startTime % 60).toString().padStart(2, '0')}
                          </p>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              )}


            </div>
          </div>

          {/* Content */}
          <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
            <label className={`block text-sm font-medium ${textLabel} mb-2`}>
              {t('content')} <span className="text-red-500">*</span>
            </label>
            <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-lg overflow-hidden border ${borderClass}`}>
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={handleContentChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder={t('enterContent')}
                style={{ minHeight: '400px' }}
              />
            </div>
          </div>

          
          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/articles/list')}
              className={`px-6 py-3 ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} border rounded-lg hover:${isDark ? 'bg-gray-600' : 'bg-gray-200'} transition-colors`}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('saving') : (isEdit ? 'Update Article' : t('createArticle'))}
            </button>
          </div>
        </form>
      </div>

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg p-6 w-full max-w-md shadow-xl`}>
            <h3 className={`text-lg font-semibold ${textClass} mb-4`}>{t('addNewCategory')}</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={t('enterCategoryName')}
              className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none mb-4`}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowCategoryModal(false); setNewCategoryName(''); }}
                className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} border rounded-lg hover:${isDark ? 'bg-gray-600' : 'bg-gray-200'} transition-colors`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('addCategory')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add City Modal */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg p-6 w-full max-w-md shadow-xl`}>
            <h3 className={`text-lg font-semibold ${textClass} mb-4`}>{t('addNewCity')}</h3>
            <input
              type="text"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              placeholder={t('enterCityName')}
              className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none mb-4`}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setShowCityModal(false); setNewCityName(''); }}
                className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} border rounded-lg hover:${isDark ? 'bg-gray-600' : 'bg-gray-200'} transition-colors`}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleAddCity}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('addCity')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ArticleForm;
