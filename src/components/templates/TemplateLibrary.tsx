import React, { useEffect, useRef, useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  Check, 
  Trash2, 
  Edit3, 
  Plus, 
  RotateCcw, 
  ArrowRight,
  BookmarkPlus
} from 'lucide-react';
import { useQR } from '../../context/QRContext';
import { QRTemplate } from '../../types';
import { renderQRToCanvas } from '../../utils/qrHelper';

export const TemplateLibrary: React.FC = () => {
  const { 
    templates, 
    applyTemplate, 
    saveCustomTemplate, 
    deleteCustomTemplate, 
    renameCustomTemplate, 
    restoreDefaultTemplates, 
    config, 
    setActiveTab 
  } = useQR();

  const [savingCustom, setSavingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [activeTemplatePreview, setActiveTemplatePreview] = useState<string | null>(null);

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    saveCustomTemplate(customName, customDesc);
    setCustomName('');
    setCustomDesc('');
    setSavingCustom(false);
  };

  const handleApply = (template: QRTemplate) => {
    applyTemplate(template);
    setActiveTemplatePreview(template.id);
  };

  const handleApplyAndEdit = (template: QRTemplate) => {
    applyTemplate(template);
    setActiveTab('generator');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Style Templates Library
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pre-engineered Apple Liquid Glass colorways and custom palettes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Save current config as template button */}
          <button
            onClick={() => setSavingCustom(true)}
            className="min-h-[44px] px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Save Current Style</span>
          </button>

          {/* Reset custom templates */}
          <button
            onClick={() => {
              if (window.confirm('Restore default template library? Custom templates will be removed.')) {
                restoreDefaultTemplates();
              }
            }}
            className="min-h-[44px] px-3.5 py-2 rounded-2xl glass-surface text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restore Defaults"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Save Custom Modal Sheet */}
      {savingCustom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-surface rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-white/20">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Save Custom Template
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Save your current generator colors ({config.fgColor} on {config.bgColor}) and settings as a reusable template.
            </p>

            <form onSubmit={handleSaveCurrentAsTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Midnight Indigo, Summer Citrus"
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Description (Optional)
                </label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="e.g., Brand guide palette for marketing campaigns"
                  className="w-full min-h-[44px] px-3.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSavingCustom(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((tpl) => (
          <TemplateCard
            key={tpl.id}
            template={tpl}
            isActive={activeTemplatePreview === tpl.id}
            isEditing={editingTemplateId === tpl.id}
            renameInput={renameInput}
            setRenameInput={setRenameInput}
            onStartRename={() => {
              setEditingTemplateId(tpl.id);
              setRenameInput(tpl.name);
            }}
            onSaveRename={() => {
              if (renameInput.trim()) {
                renameCustomTemplate(tpl.id, renameInput.trim());
              }
              setEditingTemplateId(null);
            }}
            onCancelRename={() => setEditingTemplateId(null)}
            onDelete={() => deleteCustomTemplate(tpl.id)}
            onApply={() => handleApply(tpl)}
            onApplyAndEdit={() => handleApplyAndEdit(tpl)}
          />
        ))}
      </div>
    </div>
  );
};

interface TemplateCardProps {
  template: QRTemplate;
  isActive: boolean;
  isEditing: boolean;
  renameInput: string;
  setRenameInput: (v: string) => void;
  onStartRename: () => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
  onApply: () => void;
  onApplyAndEdit: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isActive,
  isEditing,
  renameInput,
  setRenameInput,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDelete,
  onApply,
  onApplyAndEdit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderQRToCanvas(
        canvasRef.current,
        {
          type: 'url',
          url: 'https://apple.com',
          text: '',
          email: { address: '', subject: '', body: '' },
          phone: { number: '' },
          sms: { number: '', message: '' },
          wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
          vcard: { firstName: '', lastName: '', organization: '', title: '', phone: '', email: '', url: '', street: '', city: '', country: '' },
          fgColor: template.fgColor,
          bgColor: template.bgColor,
          size: 200,
          errorCorrection: template.errorCorrection,
          margin: template.margin,
          logoUrl: null,
          logoSize: 20,
          logoPadding: 4,
          logoShape: template.logoShape || 'rounded',
        },
        200
      ).catch(() => {});
    }
  }, [template]);

  return (
    <div
      className={`glass-surface rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl relative group ${
        isActive ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {template.badgeLabel || 'Theme'}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20"
              style={{ backgroundColor: template.fgColor }}
              title="Pattern Color"
            />
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/20"
              style={{ backgroundColor: template.bgColor }}
              title="Background Color"
            />
          </div>
        </div>

        {/* Real Miniature Canvas QR */}
        <div
          onClick={onApply}
          className="aspect-square w-full rounded-2xl flex items-center justify-center p-3 mb-4 cursor-pointer transition-transform group-hover:scale-[1.02]"
          style={{ backgroundColor: template.bgColor }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain block rounded-lg shadow-sm"
          />
        </div>

        {/* Title or Rename input */}
        {isEditing ? (
          <div className="flex items-center gap-1 mb-2">
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="w-full px-2 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-blue-500 text-slate-900 dark:text-white"
              autoFocus
            />
            <button
              onClick={onSaveRename}
              className="p-1 rounded text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
              {template.name}
            </h3>
            {template.isCustom && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={onStartRename}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Rename template"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1 text-rose-400 hover:text-rose-600"
                  title="Delete template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {template.description}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-white/10">
        <button
          onClick={onApply}
          className="min-h-[40px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <span>Apply</span>
        </button>

        <button
          onClick={onApplyAndEdit}
          className="min-h-[40px] px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <span>Customize</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
