import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { epaperAPI } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import { useTheme } from '../contexts/ThemeContext';

const STATIC_URL = import.meta.env.VITE_API_URL.replace(/\/api$/, '');
const buildStaticUrl = (filePath) => {
  if (!filePath) return '';
  const base = STATIC_URL.endsWith('/') ? STATIC_URL.slice(0, -1) : STATIC_URL;
  const p = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${base}${p}`;
};

const MIN_BOX = 0.02; // ignore accidental tiny drags (2% of a side)

const EpaperArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [epaper, setEpaper] = useState(null);
  const [pages, setPages] = useState([]);
  const [articles, setArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [merging, setMerging] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]); // section ids selected for merge (current page)

  const surfaceRef = useRef(null);
  const startRef = useRef(null);

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-800';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBg = isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800';

  const fetchEditor = useCallback(async () => {
    try {
      const res = await epaperAPI.getEditor(id);
      if (res.data.success) {
        const d = res.data.data;
        setEpaper(d.epaper);
        setPages(d.pages);
        setArticles(d.articles);
        setCurrentPage((prev) => (d.pages.some((p) => p.page_number === prev) ? prev : (d.pages[0]?.page_number || 1)));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load editor');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEditor();
  }, [fetchEditor]);

  // Selection is per-page — reset it whenever the admin switches pages.
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage]);

  const currentPageObj = pages.find((p) => p.page_number === currentPage) || null;
  const pageArticles = articles.filter((a) => a.page_number === currentPage);

  const getFrac = (e) => {
    const rect = surfaceRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
  };

  const onPointerDown = (e) => {
    if (e.button !== 0 || saving) return;
    surfaceRef.current.setPointerCapture(e.pointerId);
    const p = getFrac(e);
    startRef.current = p;
    setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const onPointerMove = (e) => {
    if (!startRef.current) return;
    const p = getFrac(e);
    const s = startRef.current;
    setDraft({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  };

  const onPointerUp = async () => {
    const d = draft;
    startRef.current = null;
    setDraft(null);
    if (!d || d.w < MIN_BOX || d.h < MIN_BOX) return;
    await createBox(d);
  };

  const createBox = async (box) => {
    setSaving(true);
    try {
      const res = await epaperAPI.createArticle(id, {
        page_number: currentPage,
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
      });
      if (res.data.success) {
        setArticles((prev) => [...prev, res.data.data.article]);
        toast.success('Section added');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add section');
    } finally {
      setSaving(false);
    }
  };

  const saveTitle = async (article, title) => {
    if ((article.title || '') === title.trim()) return;
    try {
      const res = await epaperAPI.updateArticle(article.id, { title: title.trim() });
      if (res.data.success) {
        setArticles((prev) => prev.map((a) => (a.id === article.id ? res.data.data.article : a)));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save title');
    }
  };

  const deleteArticle = async (article) => {
    try {
      const res = await epaperAPI.deleteArticle(article.id);
      if (res.data.success) {
        setArticles((prev) => prev.filter((a) => a.id !== article.id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete section');
    }
  };

  const triggerRender = async () => {
    setRendering(true);
    try {
      await epaperAPI.renderPages(id);
      toast.success('Rendering started — refresh in a moment');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start rendering');
    } finally {
      setRendering(false);
    }
  };

  const autoDetect = async () => {
    setDetecting(true);
    try {
      const res = await epaperAPI.autoDetectSections(id, currentPage);
      if (res.data.success) {
        const added = res.data.data.articles || [];
        if (added.length) {
          setArticles((prev) => [...prev, ...added]);
          toast.success(res.data.message || `${added.length} sections detected`);
        } else {
          toast(res.data.message || 'No sections detected', { icon: 'ℹ️' });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Auto-detect failed');
    } finally {
      setDetecting(false);
    }
  };

  const clearPage = async () => {
    if (!window.confirm(`Delete all ${pageArticles.length} section(s) on page ${currentPage}?`)) return;
    try {
      const res = await epaperAPI.clearPageSections(id, currentPage);
      if (res.data.success) {
        setArticles((prev) => prev.filter((a) => a.page_number !== currentPage));
        setSelectedIds([]);
        toast.success(res.data.message || 'Page cleared');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clear page');
    }
  };

  const toggleSelect = (articleId) => {
    setSelectedIds((prev) => (prev.includes(articleId) ? prev.filter((x) => x !== articleId) : [...prev, articleId]));
  };

  const mergeSelected = async () => {
    if (selectedIds.length < 2) return;
    setMerging(true);
    try {
      const res = await epaperAPI.mergeSections(id, selectedIds);
      if (res.data.success) {
        const merged = res.data.data.article;
        setArticles((prev) => [...prev.filter((a) => !selectedIds.includes(a.id)), merged]);
        setSelectedIds([]);
        toast.success(res.data.message || 'Sections merged');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Merge failed');
    } finally {
      setMerging(false);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('mr-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '');

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className={`text-2xl font-bold ${textClass}`}>Mark Sections</h1>
            {epaper && (
              <p className={`text-sm ${textMuted}`}>
                {epaper.edition_name} · {formatDate(epaper.publish_date)}
              </p>
            )}
          </div>
          <Link to="/admin/epapers/list" className={`px-4 py-2 border ${borderClass} ${textClass} rounded-lg`}>
            ← Back to issues
          </Link>
        </div>

        {pages.length === 0 ? (
          <div className={`${cardBg} rounded-lg border ${borderClass} p-6 text-center`}>
            <p className={`${textClass} mb-1 font-medium`}>Page images aren’t ready yet.</p>
            <p className={`${textMuted} text-sm mb-4`}>
              Render status: <strong>{epaper?.render_status || 'not started'}</strong>. Pages must be rendered before you can mark sections.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={triggerRender} disabled={rendering} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
                {rendering ? 'Starting…' : 'Render pages'}
              </button>
              <button onClick={fetchEditor} className={`px-4 py-2 border ${borderClass} ${textClass} rounded-lg`}>
                Refresh
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Page switcher */}
            <div className={`${cardBg} rounded-lg border ${borderClass} p-3`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm ${textMuted} mr-1`}>Page:</span>
                {pages.map((p) => {
                  const count = articles.filter((a) => a.page_number === p.page_number).length;
                  const active = p.page_number === currentPage;
                  return (
                    <button
                      key={p.page_number}
                      onClick={() => setCurrentPage(p.page_number)}
                      className={`min-w-[2.25rem] h-9 px-2 rounded-md text-sm font-semibold transition-colors ${
                        active ? 'bg-red-500 text-white' : isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={count ? `${count} section(s)` : 'No sections yet'}
                    >
                      {p.page_number}
                      {count > 0 && <span className="ml-1 text-xs opacity-80">·{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Drawing canvas */}
              <div className={`lg:col-span-2 ${cardBg} rounded-lg border ${borderClass} p-3`}>
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <p className={`text-sm ${textMuted}`}>
                    Drag to draw a section, or auto-detect from the page text.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={autoDetect}
                      disabled={detecting || saving}
                      className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                      title="Suggest sections from the PDF text layer — you can then adjust or delete them"
                    >
                      {detecting ? 'Detecting…' : '✨ Auto-detect'}
                    </button>
                    {pageArticles.length > 0 && (
                      <button
                        onClick={clearPage}
                        disabled={detecting || saving}
                        className="px-3 py-1.5 text-xs font-medium border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white disabled:opacity-50 transition-colors"
                        title="Delete all sections on this page"
                      >
                        Clear page
                      </button>
                    )}
                  </div>
                </div>

                {/* Merge bar — appears once sections are selected */}
                {selectedIds.length > 0 && (
                  <div className="flex items-center justify-between gap-2 mb-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/40">
                    <span className={`text-sm font-medium ${textClass}`}>
                      {selectedIds.length} selected
                      {selectedIds.length < 2 && <span className={`ml-1 ${textMuted}`}>— pick one more to merge</span>}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={mergeSelected}
                        disabled={selectedIds.length < 2 || merging}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        title="Combine the selected sections into one article"
                      >
                        {merging ? 'Merging…' : `Merge ${selectedIds.length} into one`}
                      </button>
                      <button
                        onClick={() => setSelectedIds([])}
                        className={`px-3 py-1.5 text-xs font-medium border ${borderClass} ${textClass} rounded hover:opacity-80 transition-colors`}
                      >
                        Deselect
                      </button>
                    </div>
                  </div>
                )}
                {currentPageObj && (
                  <div className="relative mx-auto select-none" style={{ maxWidth: 900 }}>
                    <img
                      src={buildStaticUrl(currentPageObj.image_url)}
                      alt={`Page ${currentPage}`}
                      className="w-full h-auto block rounded pointer-events-none"
                      draggable={false}
                    />

                    {/* Drawing surface */}
                    <div
                      ref={surfaceRef}
                      className="absolute inset-0 cursor-crosshair touch-none"
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                    />

                    {/* Existing + draft boxes (pointer-events-none so drawing passes through) */}
                    <div className="absolute inset-0 pointer-events-none">
                      {pageArticles.map((a, i) => {
                        const isSel = selectedIds.includes(a.id);
                        return (
                          <div
                            key={a.id}
                            className={`absolute border-2 ${isSel ? 'border-blue-500 bg-blue-500/15' : 'border-red-500 bg-red-500/10'}`}
                            style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%`, width: `${a.w * 100}%`, height: `${a.h * 100}%` }}
                          >
                            <button
                              onClick={() => toggleSelect(a.id)}
                              onPointerDown={(e) => e.stopPropagation()}
                              className={`absolute -top-0.5 left-0 ${isSel ? 'bg-blue-500' : 'bg-red-500'} text-white text-[10px] font-bold px-1 rounded-br leading-tight pointer-events-auto cursor-pointer`}
                              title={isSel ? 'Selected — click to deselect' : 'Click to select for merge'}
                            >
                              {isSel ? '✓' : i + 1}
                            </button>
                            <button
                              onClick={() => deleteArticle(a)}
                              onPointerDown={(e) => e.stopPropagation()}
                              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center pointer-events-auto hover:bg-black shadow"
                              title="Delete section"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                      {draft && (
                        <div
                          className="absolute border-2 border-dashed border-yellow-400 bg-yellow-400/10"
                          style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draft.w * 100}%`, height: `${draft.h * 100}%` }}
                        />
                      )}
                    </div>

                    {saving && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="bg-black/70 text-white text-sm px-3 py-1.5 rounded-lg">Saving…</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sections list for this page */}
              <div className={`${cardBg} rounded-lg border ${borderClass} p-3`}>
                <h2 className={`text-sm font-bold ${textClass} mb-3`}>
                  Sections on page {currentPage} ({pageArticles.length})
                </h2>
                {pageArticles.length === 0 ? (
                  <p className={`${textMuted} text-sm`}>None yet. Draw a box on the page to add one.</p>
                ) : (
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                    {pageArticles.map((a, i) => (
                      <div key={a.id} className={`flex gap-3 p-2 rounded-lg border ${selectedIds.includes(a.id) ? 'border-blue-500 bg-blue-500/10' : borderClass}`}>
                        <div className="flex-shrink-0 w-14 flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(a.id)}
                              onChange={() => toggleSelect(a.id)}
                              className="w-4 h-4 accent-blue-600 cursor-pointer"
                              title="Select for merge"
                            />
                            <span className={`inline-block ${selectedIds.includes(a.id) ? 'bg-blue-500' : 'bg-red-500'} text-white text-xs font-bold w-5 h-5 rounded-full leading-5 text-center`}>{i + 1}</span>
                          </div>
                          <img src={buildStaticUrl(a.image_url)} alt={`Section ${i + 1}`} className="w-14 h-auto rounded border border-gray-500/30" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            defaultValue={a.title || ''}
                            placeholder="Title (optional)"
                            onBlur={(e) => saveTitle(a, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                            className={`w-full text-sm border rounded px-2 py-1.5 outline-none focus:border-red-500 ${inputBg}`}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <a href={buildStaticUrl(a.image_url)} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs hover:underline">
                              View crop ↗
                            </a>
                            <button onClick={() => deleteArticle(a)} className="text-red-500 text-xs font-medium hover:text-red-400">
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default EpaperArticleEditor;
