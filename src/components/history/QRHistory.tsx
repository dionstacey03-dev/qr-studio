import React, { useRef, useState, useMemo } from 'react';
import { 
  History, 
  Trash2, 
  Download, 
  Search, 
  Clock, 
  ArrowRight,
  Globe, 
  FileText, 
  Mail, 
  Phone, 
  MessageSquare, 
  Wifi, 
  UserSquare, 
  Check, 
  Copy,
  FileDown,
  FileUp,
  X,
  Sparkles,
  Tag,
  CheckSquare,
  Square,
  Edit3,
  FolderArchive,
  Filter,
  Hash,
  Layers
} from 'lucide-react';
import JSZip from 'jszip';
import { useQR } from '../../context/QRContext';
import { QRHistoryItem, QRContentType } from '../../types';
import { renderQRToCanvas } from '../../utils/qrHelper';

export const QRHistory: React.FC = () => {
  const { 
    history, 
    deleteHistoryItem, 
    batchDeleteHistory,
    batchUpdateHistory,
    clearHistory, 
    loadHistoryItem, 
    exportHistoryJSON, 
    importHistoryJSON 
  } = useQR();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Multi-Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isBatchZipping, setIsBatchZipping] = useState(false);

  // Batch Edit Modal state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [namePattern, setNamePattern] = useState('Campaign 2026 - {index}');
  const [startIndex, setStartIndex] = useState(1);
  const [padZero, setPadZero] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [tagAction, setTagAction] = useState<'append' | 'replace' | 'remove'>('append');

  // Import modal states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingJson, setPendingJson] = useState<string | null>(null);
  const [pendingFilename, setPendingFilename] = useState<string>('');
  const [pendingItemCount, setPendingItemCount] = useState<number>(0);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  // Perceived performance skeleton transition
  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, filterType, filterTag]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Extract all unique tags across history for quick filter bar
  const allUniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    history.forEach((item) => {
      if (item.tags) {
        item.tags.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.rawContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesTag = !filterTag || (item.tags && item.tags.includes(filterTag));

      return matchesSearch && matchesType && matchesTag;
    });
  }, [history, searchTerm, filterType, filterTag]);

  // Selection toggles
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredHistory.map((i) => i.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Preview generated names for batch edit
  const previewBatchEdits = useMemo(() => {
    const selectedList = history.filter((i) => selectedIds.has(i.id));
    const nowStr = new Date().toISOString().slice(0, 10);
    const parsedTags = tagInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    return selectedList.map((item, idx) => {
      const num = startIndex + idx;
      const indexStr = padZero ? String(num).padStart(2, '0') : String(num);

      let newTitle = namePattern
        .replace(/{index}|{n}/gi, indexStr)
        .replace(/{title}/gi, item.title)
        .replace(/{type}/gi, item.type.toUpperCase())
        .replace(/{date}/gi, nowStr);

      if (!newTitle.trim()) {
        newTitle = item.title;
      }

      // Calculate new tags
      let newTags = [...(item.tags || [])];
      if (parsedTags.length > 0) {
        if (tagAction === 'replace') {
          newTags = parsedTags;
        } else if (tagAction === 'append') {
          const set = new Set([...newTags, ...parsedTags]);
          newTags = Array.from(set);
        } else if (tagAction === 'remove') {
          const removeSet = new Set(parsedTags);
          newTags = newTags.filter((t) => !removeSet.has(t));
        }
      }

      return {
        id: item.id,
        oldTitle: item.title,
        newTitle,
        oldTags: item.tags || [],
        newTags,
      };
    });
  }, [history, selectedIds, namePattern, startIndex, padZero, tagInput, tagAction]);

  // Apply batch edits
  const handleApplyBatchEdits = () => {
    if (previewBatchEdits.length === 0) return;

    const updates = previewBatchEdits.map((p) => ({
      id: p.id,
      title: p.newTitle,
      tags: p.newTags,
    }));

    batchUpdateHistory(updates);
    showToast(`Batch updated ${updates.length} items`);
    setShowBatchModal(false);
    deselectAll();
    setIsSelectMode(false);
  };

  // Batch delete selected items
  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Delete ${selectedIds.size} selected QR codes from history?`)) {
      batchDeleteHistory(Array.from(selectedIds));
      showToast(`Deleted ${selectedIds.size} items`);
      deselectAll();
    }
  };

  // Download selected items as a ZIP package
  const handleBatchDownloadZip = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder('qrstudio-selected');
      const selectedItems = history.filter((i) => selectedIds.has(i.id));

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        const offscreen = document.createElement('canvas');
        await renderQRToCanvas(offscreen, item.config, 1024);
        const dataUrl = offscreen.toDataURL('image/png');
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');

        const cleanTitle = (item.title || 'qr')
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '_')
          .slice(0, 30);
        const filename = `${String(i + 1).padStart(2, '0')}_${cleanTitle}.png`;
        folder?.file(filename, base64, { base64: true });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.download = `qrstudio-selected-${selectedItems.length}.zip`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`ZIP with ${selectedItems.length} QR codes downloaded!`);
    } catch (e) {
      console.error('ZIP failed:', e);
      showToast('Failed to create ZIP package');
    } finally {
      setIsBatchZipping(false);
    }
  };

  const handleDownloadItem = async (item: QRHistoryItem) => {
    try {
      const offscreen = document.createElement('canvas');
      await renderQRToCanvas(offscreen, item.config, 1024);
      const dataUrl = offscreen.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrstudio-${item.type}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Downloaded QR code PNG');
    } catch (e) {
      console.error('Failed to download from history', e);
      showToast('Failed to download image');
    }
  };

  const handleCopyContent = (item: QRHistoryItem) => {
    navigator.clipboard.writeText(item.rawContent);
    setCopiedId(item.id);
    showToast('Copied content to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Trigger JSON export
  const handleExport = () => {
    if (history.length === 0) {
      showToast('History is empty. Nothing to export.');
      return;
    }
    exportHistoryJSON();
    showToast(`Exported ${history.length} QR code${history.length > 1 ? 's' : ''} as JSON`);
  };

  // Inspect uploaded JSON file before applying
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text);
        let items: any[] = [];
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed && Array.isArray(parsed.history)) {
          items = parsed.history;
        } else if (parsed && typeof parsed.history === 'string') {
          items = JSON.parse(parsed.history);
        }

        const validCount = items.filter(
          (i) => i && typeof i === 'object' && i.type && i.config
        ).length;

        if (validCount === 0) {
          showToast('No valid QR history items found in JSON.');
          return;
        }

        setPendingJson(text);
        setPendingItemCount(validCount);
        setShowImportModal(true);
      } catch (err) {
        showToast('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Confirm import with selected mode
  const handleConfirmImport = () => {
    if (!pendingJson) return;
    const result = importHistoryJSON(pendingJson, importMode);
    setShowImportModal(false);
    setPendingJson(null);

    if (result.success) {
      showToast(
        `Successfully imported ${result.count} QR code${result.count > 1 ? 's' : ''} (${
          importMode === 'merge' ? 'merged' : 'replaced'
        })`
      );
    } else {
      showToast(result.error || 'Failed to import history');
    }
  };

  const getTypeIcon = (type: QRContentType) => {
    switch (type) {
      case 'url': return Globe;
      case 'text': return FileText;
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'sms': return MessageSquare;
      case 'wifi': return Wifi;
      case 'vcard': return UserSquare;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
      {/* Hidden File Input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Generated History
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 tabular-nums">
              {history.length}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Reopen, edit, tag, bulk-rename, and sync your QR code creations.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Multi-Select Mode Toggle */}
          {history.length > 0 && (
            <button
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                if (isSelectMode) deselectAll();
              }}
              className={`min-h-[42px] px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer shadow-sm ${
                isSelectMode
                  ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25'
                  : 'glass-surface text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>{isSelectMode ? 'Exit Select Mode' : 'Batch Select'}</span>
            </button>
          )}

          {/* Export JSON Button */}
          <button
            onClick={handleExport}
            disabled={history.length === 0}
            className={`min-h-[42px] px-4 py-2 rounded-2xl glass-surface text-xs font-bold flex items-center gap-2 border border-slate-200/80 dark:border-white/10 active:scale-95 transition-all shadow-sm ${
              history.length === 0
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 cursor-pointer'
            }`}
            title="Download complete history as JSON"
          >
            <FileDown className="w-4 h-4 text-blue-500" />
            <span>Export JSON</span>
          </button>

          {/* Import JSON Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[42px] px-4 py-2 rounded-2xl glass-surface hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-200/80 dark:border-white/10 active:scale-95 transition-all shadow-sm cursor-pointer"
            title="Import history from JSON file"
          >
            <FileUp className="w-4 h-4 text-emerald-500" />
            <span>Import JSON</span>
          </button>

          {/* Clear All History Button */}
          {history.length > 0 && !isSelectMode && (
            <button
              onClick={() => {
                if (window.confirm('Clear all saved QR history? This action cannot be undone.')) {
                  clearHistory();
                  showToast('History cleared');
                }
              }}
              className="min-h-[42px] px-3.5 py-2 rounded-2xl glass-surface text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Delete all history entries"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Select Mode Bar (Select All / Deselect) */}
      {isSelectMode && (
        <div className="glass-surface rounded-2xl p-3 mb-5 border border-blue-500/30 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 dark:text-white">
              {selectedIds.size} of {filteredHistory.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <button
                onClick={deselectAll}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold cursor-pointer"
              >
                Deselect All
              </button>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click checkboxes or cards to select items for batch editing
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, tag, or URL..."
            className="w-full min-h-[44px] pl-10 pr-4 rounded-2xl text-xs bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 glass-surface rounded-2xl">
          {['all', 'url', 'wifi', 'vcard', 'text', 'email', 'phone'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`min-h-[36px] px-3 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                filterType === type
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Tag Filter Bar if tags exist */}
      {allUniqueTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto mb-6 p-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-indigo-400" />
            Tags:
          </span>
          <button
            onClick={() => setFilterTag(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              filterTag === null
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Tags
          </button>
          {allUniqueTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                filterTag === tag
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>#{tag}</span>
            </button>
          ))}
        </div>
      )}

      {/* History Grid / List with Perceived Performance Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="glass-surface rounded-3xl p-5 shadow-sm space-y-4 skeleton-shimmer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl skeleton-glass" />
                  <div className="w-14 h-3.5 rounded-md skeleton-glass" />
                </div>
                <div className="w-20 h-3 rounded-full skeleton-glass" />
              </div>

              <div className="space-y-2 py-1">
                <div className="w-3/4 h-4 rounded-lg skeleton-glass" />
                <div className="w-full h-3 rounded-md skeleton-glass opacity-70" />
                <div className="w-1/2 h-3 rounded-md skeleton-glass opacity-70" />
              </div>

              <div className="pt-3 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-xl skeleton-glass" />
                  <div className="w-7 h-7 rounded-xl skeleton-glass" />
                  <div className="w-7 h-7 rounded-xl skeleton-glass" />
                </div>
                <div className="w-16 h-7 rounded-xl skeleton-glass" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHistory.map((item) => {
            const Icon = getTypeIcon(item.type);
            const isSelected = selectedIds.has(item.id);
            const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isSelectMode) toggleSelect(item.id);
                }}
                className={`glass-surface rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative ${
                  isSelectMode ? 'cursor-pointer' : ''
                } ${
                  isSelected ? 'ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isSelectMode ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(item.id);
                          }}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 dark:border-white/20 hover:border-blue-500'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Icon className="w-4 h-4" />
                        </div>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {item.summary}
                  </p>

                  {/* Tags Pill Row */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterTag(tag);
                          }}
                          className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-500/20 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {/* Copy Content */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyContent(item);
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Copy content"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* Quick Download PNG */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadItem(item);
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Download PNG"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Delete Item */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistoryItem(item.id);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                      title="Delete from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Reopen in Generator */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      loadHistoryItem(item);
                    }}
                    className="min-h-[38px] px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <span>Edit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-surface rounded-3xl p-12 text-center max-w-lg mx-auto">
          <History className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            {searchTerm || filterType !== 'all' || filterTag ? 'No matching records' : 'No QR history yet'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            {searchTerm || filterType !== 'all' || filterTag
              ? 'Try broadening your search or resetting the category/tag filter.'
              : 'Every QR code you generate is automatically saved here. You can also import an existing history JSON file from another device.'}
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[42px] px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <FileUp className="w-4 h-4" />
            <span>Import History File</span>
          </button>
        </div>
      )}

      {/* Floating Bottom Batch Action Bar when items selected */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-xl mx-auto z-50 glass-floating-nav rounded-2xl p-2.5 shadow-2xl border border-blue-500/30 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 pl-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs">
              {selectedIds.size}
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white hidden sm:inline">
              Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Open Batch Rename & Tag Modal */}
            <button
              onClick={() => setShowBatchModal(true)}
              className="min-h-[40px] px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Batch Rename & Tag</span>
            </button>

            {/* Batch ZIP Download */}
            <button
              onClick={handleBatchDownloadZip}
              disabled={isBatchZipping}
              className="min-h-[40px] px-3.5 rounded-xl glass-surface hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-200/80 dark:border-white/10 cursor-pointer active:scale-95 transition-all"
              title="Download selected as ZIP"
            >
              <FolderArchive className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">ZIP</span>
            </button>

            {/* Batch Delete */}
            <button
              onClick={handleBatchDelete}
              className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
              title="Delete selected"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Clear Selection */}
            <button
              onClick={deselectAll}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Renaming & Tagging Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl glass-surface rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/20 dark:border-white/10 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBatchModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  Batch Rename & Tag
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Applying unified naming convention to {selectedIds.size} selected QR codes
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Naming Convention Pattern Field */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5">
                  Title Pattern
                </label>
                <input
                  type="text"
                  value={namePattern}
                  onChange={(e) => setNamePattern(e.target.value)}
                  placeholder="e.g. Campaign 2026 - {index}"
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-sm font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Variable Token Chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Insert variable:</span>
                  {[
                    { token: '{index}', label: 'Sequence Index' },
                    { token: '{title}', label: 'Original Title' },
                    { token: '{type}', label: 'QR Type' },
                    { token: '{date}', label: 'Date (YYYY-MM-DD)' },
                  ].map((chip) => (
                    <button
                      key={chip.token}
                      type="button"
                      onClick={() => setNamePattern((prev) => `${prev} ${chip.token}`.trim())}
                      className="px-2 py-0.5 rounded-md font-mono text-[11px] bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {chip.token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numbering options */}
              <div className="grid grid-cols-2 gap-4 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Index Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={startIndex}
                    onChange={(e) => setStartIndex(parseInt(e.target.value, 10) || 1)}
                    className="w-full min-h-[38px] px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold">
                    <input
                      type="checkbox"
                      checked={padZero}
                      onChange={(e) => setPadZero(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Pad with zero (01, 02...)</span>
                  </label>
                </div>
              </div>

              {/* Tag Management */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Batch Edit Tags</span>
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="e.g. Marketing, Q4 Campaign, VIP, Print"
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Tag Action Mode Selector */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { id: 'append', label: 'Append Tags', desc: 'Keep existing, add new' },
                    { id: 'replace', label: 'Replace Tags', desc: 'Overwrite all tags' },
                    { id: 'remove', label: 'Remove Tags', desc: 'Delete matching tags' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setTagAction(mode.id as any)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        tagAction === mode.id
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                          : 'border-slate-200/70 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{mode.label}</div>
                      <div className="text-[10px] text-slate-400">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview List */}
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                  Preview ({previewBatchEdits.length} items)
                </span>
                <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-white/10 divide-y divide-slate-100 dark:divide-white/5 bg-white/40 dark:bg-slate-950/40 text-xs">
                  {previewBatchEdits.slice(0, 10).map((preview, i) => (
                    <div key={preview.id} className="p-2.5 flex items-center justify-between gap-4">
                      <div className="truncate flex-1">
                        <span className="text-slate-400 line-through text-[11px] block truncate">
                          {preview.oldTitle}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          {preview.newTitle}
                        </span>
                      </div>
                      {preview.newTags.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0 flex-wrap max-w-xs justify-end">
                          {preview.newTags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {previewBatchEdits.length > 10 && (
                    <div className="p-2 text-center text-[11px] text-slate-400">
                      + {previewBatchEdits.length - 10} more items will be updated
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/60 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="min-h-[42px] px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyBatchEdits}
                  className="min-h-[42px] px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Apply Batch Renaming & Tags
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-surface rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-white/10 relative">
            <button
              onClick={() => {
                setShowImportModal(false);
                setPendingJson(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                  Import QR History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pendingFilename}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 mb-5">
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span>Valid QR Entries Detected:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {pendingItemCount} items
                </span>
              </div>
            </div>

            {/* Import Mode Options */}
            <div className="space-y-2 mb-6">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Choose Import Strategy:
              </label>

              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-colors cursor-pointer ${
                  importMode === 'merge'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                  importMode === 'merge' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                }`}>
                  {importMode === 'merge' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Merge with existing history (Recommended)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Adds new items without overwriting your current {history.length} records.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-colors cursor-pointer ${
                  importMode === 'replace'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                  importMode === 'replace' ? 'border-rose-600 bg-rose-600' : 'border-slate-300'
                }`}>
                  {importMode === 'replace' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Replace current history
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Wipes the current list and replaces it entirely with the {pendingItemCount} items from this file.
                  </p>
                </div>
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setPendingJson(null);
                }}
                className="min-h-[42px] px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="min-h-[42px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 lg:bottom-10 right-6 z-50 glass-floating-nav px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/20 animate-fade-in">
          <Check className="w-4 h-4 text-blue-500" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
