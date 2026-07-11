import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const todayISO = () => new Date().toISOString().slice(0, 10);

const EpaperForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { isDark } = useTheme();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [editions, setEditions] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState(null);

  const [formData, setFormData] = useState({
    edition_id: '',
    publish_date: todayISO(),
    is_published: true,
  });

  useEffect(() => {
    epaperAPI.getEditions().then((res) => {
      if (res.data.success) {
        setEditions(res.data.data.editions);
        setFormData((prev) => (prev.edition_id ? prev : { ...prev, edition_id: res.data.data.editions[0]?.id || '' }));
      }
    }).catch(() => toast.error(t('failedToFetchEditions')));
  }, []);

  useEffect(() => {
    if (isEdit) fetchEpaper();
  }, [id]);

  const fetchEpaper = async () => {
    try {
      setLoading(true);
      const response = await epaperAPI.getById(id);
      if (!response.data.success) {
        toast.error(t('noEpapersFound'));
        navigate('/admin/epapers/list');
        return;
      }
      const epaper = response.data.data.epaper;
      setFormData({
        edition_id: epaper.edition_id,
        publish_date: epaper.publish_date.slice(0, 10),
        is_published: !!epaper.is_published,
      });
      setExistingPdfUrl(epaper.pdf_url);
      if (epaper.thumbnail_url) setThumbnailPreview(buildStaticUrl(epaper.thumbnail_url));
    } catch (error) {
      toast.error(t('failedToFetchEpapers'));
      navigate('/admin/epapers/list');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error(t('pdfFile'));
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      toast.error('PDF must be under 200MB');
      return;
    }
    setPdfFile(file);
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Thumbnail must be under 2MB');
      return;
    }
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setThumbnailPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.edition_id) {
      toast.error(t('selectEdition'));
      return;
    }
    if (!formData.publish_date) {
      toast.error(t('publishDate'));
      return;
    }
    if (!isEdit && !pdfFile) {
      toast.error(t('pdfRequired'));
      return;
    }

    setSaving(true);
    setUploadProgress(pdfFile ? 0 : null);
    try {
      const data = new FormData();
      data.append('edition_id', formData.edition_id);
      data.append('publish_date', formData.publish_date);
      data.append('is_published', formData.is_published ? 'true' : 'false');
      if (pdfFile) data.append('pdf', pdfFile);
      if (thumbnailFile) data.append('thumbnail', thumbnailFile);

      const onUploadProgress = pdfFile
        ? (evt) => {
            if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        : undefined;

      if (isEdit) {
        const response = await epaperAPI.update(id, data, onUploadProgress);
        if (response.data.success) {
          toast.success(t('epaperUpdated'));
          navigate('/admin/epapers/list');
        }
      } else {
        const response = await epaperAPI.create(data, onUploadProgress);
        if (response.data.success) {
          toast.success(t('epaperUploaded'));
          navigate('/admin/epapers/list');
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || t('failedToFetchEpapers');
      toast.error(message);
    } finally {
      setSaving(false);
      setUploadProgress(null);
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
        <h1 className={`text-2xl font-bold ${textClass}`}>
          {isEdit ? t('epaperUpdated') : t('uploadEpaper')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Edition + Date */}
          <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${textLabel} mb-2`}>
                  {t('edition')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="edition_id"
                  value={formData.edition_id}
                  onChange={handleChange}
                  className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                >
                  <option value="">{t('selectEdition')}</option>
                  {editions.map((ed) => (
                    <option key={ed.id} value={ed.id}>{ed.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textLabel} mb-2`}>
                  {t('publishDate')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="publish_date"
                  value={formData.publish_date}
                  onChange={handleChange}
                  className={`w-full border ${inputBg} ${inputText} rounded-lg px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none`}
                />
              </div>
            </div>
          </div>

          {/* PDF Upload */}
          <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
            <label className={`block text-sm font-medium ${textLabel} mb-2`}>
              {t('pdfFile')} {!isEdit && <span className="text-red-500">*</span>}
            </label>
            {isEdit && existingPdfUrl && !pdfFile && (
              <p className="text-xs mb-2">
                <a href={buildStaticUrl(existingPdfUrl)} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {t('pdfFile')} ↗
                </a>
              </p>
            )}
            <input
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              className={`w-full ${textMuted} file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-500 file:text-white file:cursor-pointer hover:file:bg-red-600 transition-colors`}
            />
            {pdfFile && <p className={`${textMuted} text-xs mt-1`}>{pdfFile.name}</p>}
            <p className={`${textMuted} text-xs mt-1`}>
              {isEdit ? t('replacePdf') : 'PDF · Max 200MB'}
            </p>
          </div>

          {/* Thumbnail Upload */}
          <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
            <label className={`block text-sm font-medium ${textLabel} mb-2`}>{t('coverThumbnail')}</label>
            <div className="flex items-start space-x-4">
              {thumbnailPreview && (
                <img src={thumbnailPreview} alt="Cover preview" className="w-32 h-44 object-cover rounded border border-gray-500/30" />
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className={`w-full ${textMuted} file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-500 file:text-white file:cursor-pointer hover:file:bg-red-600 transition-colors`}
                />
                <p className={`${textMuted} text-xs mt-1`}>
                  {isEdit ? t('replaceThumbnail') : 'Front-page cover image · Max 2MB'}
                </p>
                <p className={`${textMuted} text-xs mt-1`}>
                  {t('thumbnailAutoGenerateHint')}
                </p>
              </div>
            </div>
          </div>

          {/* Published Status */}
          <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className={`w-11 h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500`}></div>
              <span className={`ml-3 ${textLabel} text-sm font-medium`}>
                {formData.is_published ? t('published') : t('unpublished')}
              </span>
            </label>
          </div>

          {saving && uploadProgress !== null && (
            <div className={`${cardBg} rounded-lg shadow-sm border ${borderClass} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${textLabel}`}>
                  {uploadProgress < 100 ? 'अपलोड होत आहे...' : 'प्रक्रिया करत आहे...'}
                </span>
                <span className={`text-sm ${textMuted}`}>{uploadProgress}%</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-full bg-red-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/epapers/list')}
              disabled={saving}
              className={`px-6 py-3 ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'} border rounded-lg hover:${isDark ? 'bg-gray-600' : 'bg-gray-200'} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? (uploadProgress !== null ? `${t('saving')} ${uploadProgress}%` : t('saving'))
                : (isEdit ? t('epaperUpdated') : t('uploadEpaper'))}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default EpaperForm;
