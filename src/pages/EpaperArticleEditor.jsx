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

const MIN_BOX = 0.02;      // ignore accidental tiny drags (2% of a side)
const MIN_SIZE = 0.02;     // minimum box side when resizing
const HANDLE_HIT = 14;     // px radius to grab a resize handle
const SCROLL_EDGE = 70;    // px from viewport edge that triggers auto-scroll while dragging
const SCROLL_STEP = 24;    // px scrolled per move near an edge
const HANDLE_DIRS = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

const handlePos = {
  nw: { left: '0%', top: '0%' }, n: { left: '50%', top: '0%' }, ne: { left: '100%', top: '0%' },
  w: { left: '0%', top: '50%' }, e: { left: '100%', top: '50%' },
  sw: { left: '0%', top: '100%' }, s: { left: '50%', top: '100%' }, se: { left: '100%', top: '100%' },
};
const cursorForHandle = (h) => {
  if (h === 'n' || h === 's') return 'ns-resize';
  if (h === 'e' || h === 'w') return 'ew-resize';
  if (h === 'nw' || h === 'se') return 'nwse-resize';
  return 'nesw-resize';
};

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
  const interactionRef = useRef(null); // { kind:'draw'|'move'|'resize', articleId, handle, startPx, origBox }
  const [liveBox, setLiveBox] = useState(null); // box being moved/resized (live, pre-commit)
  const [hoveredId, setHoveredId] = useState(null); // box under cursor → show its resize handles

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

  // Selection + any in-progress interaction is per-page — reset on page switch.
  useEffect(() => {
    setSelectedIds([]);
    setLiveBox(null);
    setHoveredId(null);
    interactionRef.current = null;
  }, [currentPage]);

  const currentPageObj = pages.find((p) => p.page_number === currentPage) || null;
  const pageArticles = articles.filter((a) => a.page_number === currentPage);

  const getPos = (e) => {
    const rect = surfaceRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return {
      rect,
      px,
      py,
      fx: Math.min(1, Math.max(0, px / rect.width)),
      fy: Math.min(1, Math.max(0, py / rect.height)),
    };
  };

  // Decide what a pointerdown grabs: a resize handle, a box body (move), or empty (draw).
  const hitTest = (px, py, rect) => {
    for (let i = pageArticles.length - 1; i >= 0; i--) {
      const a = pageArticles[i];
      const bx = a.x * rect.width, by = a.y * rect.height, bw = a.w * rect.width, bh = a.h * rect.height;
      for (const dir of HANDLE_DIRS) {
        const hx = bx + (dir.includes('w') ? 0 : dir.includes('e') ? bw : bw / 2);
        const hy = by + (dir.includes('n') ? 0 : dir.includes('s') ? bh : bh / 2);
        if (Math.abs(px - hx) <= HANDLE_HIT && Math.abs(py - hy) <= HANDLE_HIT) {
          return { kind: 'resize', articleId: a.id, handle: dir };
        }
      }
    }
    for (let i = pageArticles.length - 1; i >= 0; i--) {
      const a = pageArticles[i];
      const bx = a.x * rect.width, by = a.y * rect.height, bw = a.w * rect.width, bh = a.h * rect.height;
      if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) {
        return { kind: 'move', articleId: a.id };
      }
    }
    return { kind: 'draw' };
  };

  // Scroll the window when a drag reaches the top/bottom edge, so a big selection can
  // extend beyond the visible area.
  const autoScroll = (e) => {
    if (e.clientY < SCROLL_EDGE) window.scrollBy(0, -SCROLL_STEP);
    else if (e.clientY > window.innerHeight - SCROLL_EDGE) window.scrollBy(0, SCROLL_STEP);
  };

  const onPointerDown = (e) => {
    if (e.button !== 0 || saving) return;
    const { rect, px, py, fx, fy } = getPos(e);
    const hit = hitTest(px, py, rect);
    surfaceRef.current.setPointerCapture(e.pointerId);

    if (hit.kind === 'draw') {
      interactionRef.current = { kind: 'draw', startFrac: { x: fx, y: fy } };
      setDraft({ x: fx, y: fy, w: 0, h: 0 });
      return;
    }
    const a = pageArticles.find((x) => x.id === hit.articleId);
    if (!a) return;
    interactionRef.current = {
      kind: hit.kind,
      articleId: a.id,
      handle: hit.handle,
      startPx: { x: px, y: py },
      origBox: { x: a.x, y: a.y, w: a.w, h: a.h },
    };
    setLiveBox({ id: a.id, x: a.x, y: a.y, w: a.w, h: a.h });
  };

  const onPointerMove = (e) => {
    const it = interactionRef.current;

    // Idle hover: show resize handles + a matching cursor for the box under the pointer.
    if (!it) {
      if (!surfaceRef.current) return;
      const { rect, px, py } = getPos(e);
      const hit = hitTest(px, py, rect);
      surfaceRef.current.style.cursor =
        hit.kind === 'resize' ? cursorForHandle(hit.handle) : hit.kind === 'move' ? 'move' : 'crosshair';
      const overId = hit.kind === 'draw' ? null : hit.articleId;
      if (overId !== hoveredId) setHoveredId(overId);
      return;
    }

    autoScroll(e);
    const { rect, px, py, fx, fy } = getPos(e);

    if (it.kind === 'draw') {
      const s = it.startFrac;
      setDraft({ x: Math.min(s.x, fx), y: Math.min(s.y, fy), w: Math.abs(fx - s.x), h: Math.abs(fy - s.y) });
      return;
    }

    if (it.kind === 'move') {
      const dx = (px - it.startPx.x) / rect.width;
      const dy = (py - it.startPx.y) / rect.height;
      const { w, h } = it.origBox;
      const x = Math.min(1 - w, Math.max(0, it.origBox.x + dx));
      const y = Math.min(1 - h, Math.max(0, it.origBox.y + dy));
      setLiveBox({ id: it.articleId, x, y, w, h });
      return;
    }

    // resize
    let left = it.origBox.x, top = it.origBox.y;
    let right = it.origBox.x + it.origBox.w, bottom = it.origBox.y + it.origBox.h;
    const h = it.handle;
    if (h.includes('w')) left = Math.min(fx, right - MIN_SIZE);
    if (h.includes('e')) right = Math.max(fx, left + MIN_SIZE);
    if (h.includes('n')) top = Math.min(fy, bottom - MIN_SIZE);
    if (h.includes('s')) bottom = Math.max(fy, top + MIN_SIZE);
    left = Math.max(0, left); top = Math.max(0, top);
    right = Math.min(1, right); bottom = Math.min(1, bottom);
    setLiveBox({ id: it.articleId, x: left, y: top, w: right - left, h: bottom - top });
  };

  const onPointerUp = async () => {
    const it = interactionRef.current;
    interactionRef.current = null;
    if (!it) return;

    if (it.kind === 'draw') {
      const d = draft;
      setDraft(null);
      if (!d || d.w < MIN_BOX || d.h < MIN_BOX) return;
      await createBox(d);
      return;
    }

    const lb = liveBox;
    setLiveBox(null);
    if (!lb) return;
    const o = it.origBox;
    const changed =
      Math.abs(lb.x - o.x) > 0.001 || Math.abs(lb.y - o.y) > 0.001 ||
      Math.abs(lb.w - o.w) > 0.001 || Math.abs(lb.h - o.h) > 0.001;
    if (changed) await commitBox(it.articleId, lb);
  };

  const commitBox = async (articleId, box) => {
    setSaving(true);
    try {
      const res = await epaperAPI.updateArticle(articleId, { x: box.x, y: box.y, w: box.w, h: box.h });
      if (res.data.success) {
        setArticles((prev) => prev.map((a) => (a.id === articleId ? res.data.data.article : a)));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update section');
    } finally {
      setSaving(false);
    }
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
                    Drag empty space to draw. Grab a box to move it, or drag its handles to resize — extend downward for big articles (the view scrolls).
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
                        const box = liveBox && liveBox.id === a.id ? liveBox : a;
                        const showHandles = hoveredId === a.id || (liveBox && liveBox.id === a.id);
                        return (
                          <div
                            key={a.id}
                            className={`absolute border-2 ${isSel ? 'border-blue-500 bg-blue-500/15' : 'border-red-500 bg-red-500/10'}`}
                            style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }}
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
                            {/* Resize handles (visual only — hit-testing is done on the surface) */}
                            {showHandles && HANDLE_DIRS.map((d) => (
                              <span
                                key={d}
                                className="absolute w-2.5 h-2.5 bg-white border border-red-500 rounded-sm shadow"
                                style={{ ...handlePos[d], transform: 'translate(-50%, -50%)' }}
                              />
                            ))}
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
