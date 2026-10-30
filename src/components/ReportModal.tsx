/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Post, User } from '../types.js';
import { api } from '../services/api.js';

interface ReportModalProps {
  targetPost?: Post | null;
  targetUser?: User | null;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  targetPost,
  targetUser,
  onClose,
}) => {
  const [reason, setReason] = useState<string>('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reportReasons = [
    { id: 'spam', label: 'Spam or automated bots' },
    { id: 'inappropriate', label: 'Inappropriate, nudity, or graphic content' },
    { id: 'harassment', label: 'Harassment, hate speech, or bullying' },
    { id: 'copyright', label: 'Intellectual property or copyright infringement' },
    { id: 'other', label: 'Other violation of community guidelines' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const targetType = targetPost ? 'post' : 'user';
      const targetId = targetPost ? targetPost.id : targetUser?.id || '';
      const targetAuthorUsername = targetPost
        ? targetPost.author.username
        : targetUser?.username;
      const targetPreview = targetPost
        ? targetPost.caption || targetPost.mediaUrl
        : targetUser?.bio;

      await api.submitReport({
        targetType,
        targetId,
        reason: reason as 'spam' | 'inappropriate' | 'harassment' | 'copyright' | 'hate_speech' | 'other',
        details,
        targetAuthorUsername,
        targetPreview,
      });

      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0e0c16] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-base">
            <ShieldAlert className="w-5 h-5" />
            <span>Report Violation</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
            <h4 className="text-base font-bold text-neutral-900 dark:text-white">
              Thank You for Reporting
            </h4>
            <p className="text-xs text-neutral-500 max-w-xs">
              Your report has been forwarded to our Trust & Safety dashboard. We review all flagged content promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Why are you reporting this {targetPost ? 'post' : 'account'}?
            </p>

            <div className="space-y-2">
              {reportReasons.map(r => (
                <label
                  key={r.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    reason === r.id
                      ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 font-semibold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={() => setReason(r.id)}
                    className="accent-purple-600"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>

            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Additional context or specific details (optional)..."
              rows={3}
              className="w-full p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm disabled:opacity-40 transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
