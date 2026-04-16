import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adsAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const AdForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('image');

  const [formData, setFormData] = useState({
    title: '',
    redirect_url: '',
    placement: 'top_banner',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    if (isEdit) {
      fetchAd();
    }
  }, [id]);

  const fetchAd = async () => {
    try {
      setLoading(true);
      const response = await adsAPI.getById(id);
      
      if (!response.data.success) {
        toast.error(t('advertisementNotFound'));
        navigate('/admin/ads/list');
        return;
      }

      const ad = response.data.data.ad;
      setFormData({
        title: ad.title,
        redirect_url: ad.redirect_url || '',
        placement: ad.placement,
        start_date: ad.start_date.slice(0, 16),
        end_date: ad.end_date.slice(0, 16),
        is_active: ad.is_active,
      });
      setMediaPreview(ad.media_url?.startsWith('http') ? ad.media_url : `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}${ad.media_url}`);
      setMediaType(ad.type);
    } catch (error) {
      toast.error('Failed to fetch advertisement');
      navigate('/admin/ads/list');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    // Determine media type
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.placement) {
      toast.error('Placement is required');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error('Start and end dates are required');
      return;
    }

    if (!isEdit && !mediaFile) {
      toast.error('Media file is required');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      if (formData.redirect_url) data.append('redirect_url', formData.redirect_url);
      data.append('placement', formData.placement);
      data.append('start_date', new Date(formData.start_date).toISOString());
      data.append('end_date', new Date(formData.end_date).toISOString());
      data.append('is_active', formData.is_active ? 'true' : 'false');
      if (mediaFile) data.append('file', mediaFile);

      if (isEdit) {
        const response = await adsAPI.update(id, data);
        if (response.data.success) {
          toast.success('Advertisement updated successfully');
          navigate('/admin/ads/list');
        }
      } else {
        const response = await adsAPI.create(data);
        if (response.data.success) {
          toast.success('Advertisement created successfully');
          navigate('/admin/ads/list');
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} advertisement`;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-800';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const textLabel = isDark ? 'text-gray-300' : 'text-gray-700';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';
  const inputText = isDark ? 'text-white' : 'text-gray-800';

  if (loading && isEdit) {
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
        {/* Page Header */}
        <h1 className={`text-2xl font-bold ${textClass}`}>
          {isEdit ? t('editAdvertisement') : t('createAdvertisement')}
        </h1>

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
              placeholder={t('enterAdvertisementTitle')}
              className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
            />
          </div>

          {/* Media Upload */}
          <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
            <label className={`block text-sm font-medium ${textLabel} mb-2`}>
              {t('mediaImageVideo')} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-start space-x-4">
              {mediaPreview && (
                <div className="flex-shrink-0">
                  {mediaType === 'image' ? (
                    <img
                      src={mediaPreview}
                      alt="Media preview"
                      className="w-48 h-32 object-cover rounded"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      className="w-48 h-32 object-cover rounded"
                      controls
                    />
                  )}
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaChange}
                  className={`w-full ${textMuted} file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-500 file:text-white file:cursor-pointer hover:file:bg-red-600 transition-colors`}
                />
                <p className={`${textMuted} text-xs mt-1`}>
                  {t('supportedFormats')}
                </p>
              </div>
            </div>
          </div>

          {/* Placement & Redirect URL */}
          <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${textLabel} mb-2`}>
                  {t('placement')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="placement"
                  value={formData.placement}
                  onChange={handleChange}
                  className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                >
                  <option value="top_banner">{t('topBanner')}</option>
                  <option value="sidebar">{t('sidebar')}</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textLabel} mb-2`}>
                  {t('redirectUrlOptional')}
                </label>
                <input
                  type="url"
                  name="redirect_url"
                  value={formData.redirect_url}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${textLabel} mb-2`}>
                  {t('startDate')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${textLabel} mb-2`}>
                  {t('endDate')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                />
              </div>
            </div>
          </div>

          {/* Active Status */}
          <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500`}></div>
              <span className={`ml-3 ${textLabel} text-sm font-medium`}>
                {formData.is_active ? t('active') : t('inactive')}
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/ads/list')}
              className={`px-6 py-3 ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} border rounded-lg hover:${isDark ? 'bg-gray-600' : 'bg-gray-200'} transition-colors`}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('saving') : (isEdit ? t('updateAdvertisement') : t('createAdvertisement'))}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AdForm;
