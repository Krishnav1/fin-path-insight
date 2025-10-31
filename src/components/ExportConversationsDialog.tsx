/**
 * Export Conversations Dialog
 * UI for exporting conversations in multiple formats
 */

import React, { useState } from 'react';
import { Download, FileText, Code, Share2, X, CheckCircle } from 'lucide-react';
import { exportService, ConversationData } from '@/services/exportService';

interface ExportConversationsDialogProps {
  conversations: ConversationData[];
  isOpen: boolean;
  onClose: () => void;
}

export const ExportConversationsDialog: React.FC<ExportConversationsDialogProps> = ({
  conversations,
  isOpen,
  onClose
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'markdown' | 'json'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportService.exportConversations(conversations, selectedFormat);
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    try {
      const conversationIds = conversations.map(c => c.id);
      const url = await exportService.shareConversations(conversationIds);
      setShareUrl(url);
      setTimeout(() => setShareUrl(null), 3000);
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const formats = [
    {
      id: 'pdf' as const,
      name: 'PDF',
      icon: <FileText size={24} />,
      description: 'Professional document with formatting',
      color: 'text-red-600'
    },
    {
      id: 'markdown' as const,
      name: 'Markdown',
      icon: <FileText size={24} />,
      description: 'Plain text with markdown syntax',
      color: 'text-blue-600'
    },
    {
      id: 'json' as const,
      name: 'JSON',
      icon: <Code size={24} />,
      description: 'Structured data format',
      color: 'text-green-600'
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Export Conversations
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} selected
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Format Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Select Export Format
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {formats.map(format => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedFormat === format.id
                        ? 'border-fin-teal bg-fin-teal/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-fin-teal/50'
                    }`}
                  >
                    <div className={`${format.color} mb-2`}>{format.icon}</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      {format.name}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {format.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Preview
              </h3>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="space-y-3">
                  {conversations.slice(0, 3).map((conv, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {new Date(conv.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-slate-600 dark:text-slate-400 truncate">
                        {conv.user_message}
                      </div>
                    </div>
                  ))}
                  {conversations.length > 3 && (
                    <div className="text-xs text-slate-500 dark:text-slate-500 italic">
                      +{conversations.length - 3} more conversations...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Success Message */}
            {exportSuccess && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-200">
                  Export successful! File downloaded.
                </span>
              </div>
            )}

            {/* Share URL */}
            {shareUrl && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  Link copied to clipboard!
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-mono break-all">
                  {shareUrl}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Share2 size={18} />
              Share Link
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-2 bg-fin-teal text-white rounded-lg hover:bg-fin-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportConversationsDialog;
