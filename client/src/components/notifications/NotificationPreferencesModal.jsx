import { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Lock,
  Smartphone,
  Check,
  RotateCcw,
  Volume2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Button } from '../ui';
import { Capacitor } from '@capacitor/core';
import { requestWebPushPermission } from '../../lib/firebase';

export default function NotificationPreferencesModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enablingPush, setEnablingPush] = useState(false);
  const [pushGranted, setPushGranted] = useState(false);
  const [preferences, setPreferences] = useState({
    announcements: true,
    low_attendance: true,
    lecture_reminders: true,
    attendance_updates: true,
    study_material: true,
    security_alerts: true, // locked
  });

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    // Check device push status
    if (Capacitor.isNativePlatform()) {
      setPushGranted(true);
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushGranted(Notification.permission === 'granted');
    }

    async function loadPrefs() {
      setLoading(true);
      try {
        const { data } = await api.get('/notifications/preferences');
        if (mounted && data.data?.preferences) {
          setPreferences({ ...data.data.preferences, security_alerts: true });
        }
      } catch (err) {
        console.warn('Failed to load preferences:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPrefs();
    return () => { mounted = false; };
  }, [isOpen]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.put('/notifications/preferences', preferences);
      toast.success('Notification preferences updated successfully');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  }

  async function handleEnablePush() {
    setEnablingPush(true);
    try {
      const res = await requestWebPushPermission();
      if (res.granted) {
        setPushGranted(true);
        toast.success('Push notifications active!');
      } else if (res.reason) {
        toast.error(res.reason);
      }
    } catch (err) {
      toast.error(err.message || 'Push permission request failed');
    } finally {
      setEnablingPush(false);
    }
  }

  const toggleAll = (state) => {
    setPreferences({
      announcements: state,
      low_attendance: state,
      lecture_reminders: state,
      attendance_updates: state,
      study_material: state,
      security_alerts: true, // mandatory
    });
  };

  if (!isOpen) return null;

  const categories = [
    {
      key: 'lecture_reminders',
      label: 'Lecture Start Reminders',
      desc: 'Automatic alert 10 minutes before your scheduled class starts.',
      icon: Clock,
      color: 'text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    },
    {
      key: 'announcements',
      label: 'Department & College Notices',
      desc: 'Broadcasts published by teachers and college administration with attachments.',
      icon: Bell,
      color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    },
    {
      key: 'low_attendance',
      label: 'Low Attendance Warnings',
      desc: 'Alerts if subject attendance falls below 75% examination threshold.',
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    },
    {
      key: 'attendance_updates',
      label: 'Attendance Marking & Corrections',
      desc: 'Confirmations when presence is recorded or adjusted by faculty.',
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    },
    {
      key: 'study_material',
      label: 'Study Material & Circulars',
      desc: 'Updates when syllabus notes, timetables, or exam schedules are shared.',
      icon: BookOpen,
      color: 'text-teal-600 bg-teal-50 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    },
    {
      key: 'security_alerts',
      label: 'Security & Account Alerts',
      desc: 'Critical security alerts for password resets, logins, and account activity.',
      icon: ShieldAlert,
      color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      locked: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-surface border border-line rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center shadow-xs">
              <Volume2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-ink leading-snug">Notification Settings</h3>
              <p className="text-xs text-muted">Customize push and in-app alerts on this device</p>
            </div>
          </div>
          <button
            type="button"
            id="close-preferences-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-bg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          {/* Push Status Card */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
            pushGranted
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <Smartphone className={`w-5 h-5 shrink-0 ${pushGranted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight">
                  {Capacitor.isNativePlatform()
                    ? 'Android System Notifications: Active'
                    : pushGranted
                    ? 'Browser Push Notifications: Enabled'
                    : 'System Notifications: Not Activated'}
                </p>
                <p className="text-[11px] text-muted opacity-80 mt-0.5 truncate">
                  {Capacitor.isNativePlatform()
                    ? 'Alerts will appear in Android lock screen and tray'
                    : pushGranted
                    ? 'Instant alerts delivered directly to your device'
                    : 'Allow notification permissions to receive background alerts'}
                </p>
              </div>
            </div>

            {!pushGranted && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleEnablePush}
                loading={enablingPush}
                className="shrink-0 text-xs h-7.5 px-2.5 shadow-xs"
              >
                Enable
              </Button>
            )}
          </div>

          {/* Quick Master Actions */}
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-semibold text-muted uppercase tracking-wider text-[11px]">Category Alerts</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAll(true)}
                className="text-xs text-brand font-semibold hover:underline cursor-pointer active:scale-95"
              >
                Turn On All
              </button>
              <span className="text-line">•</span>
              <button
                type="button"
                onClick={() => toggleAll(false)}
                className="text-xs text-muted hover:text-ink font-medium cursor-pointer active:scale-95"
              >
                Mute Optional
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-7 h-7 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
              <p className="text-xs text-muted font-medium">Loading preferences...</p>
            </div>
          ) : (
            categories.map(({ key, label, desc, icon: Icon, color, locked }) => {
              const isChecked = preferences[key] !== false;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-bg border border-line hover:border-brand/30 transition-all shadow-2xs"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 shadow-2xs ${color}`}>
                      <Icon size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-ink leading-tight">{label}</span>
                        {locked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                            <Lock size={10} /> Mandatory
                          </span>
                        ) : isChecked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                            <Check size={10} /> ON
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-muted bg-neutral-200/50 dark:bg-neutral-800 border border-line px-1.5 py-0.5 rounded-md">
                            OFF
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-1 leading-relaxed break-words">{desc}</p>
                    </div>
                  </div>

                  {/* High-Contrast Interactive Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isChecked}
                    disabled={locked}
                    onClick={() => {
                      if (!locked) {
                        setPreferences((prev) => ({ ...prev, [key]: !isChecked }));
                      }
                    }}
                    className={`relative w-12 h-6.5 rounded-full transition-colors duration-200 ease-in-out shrink-0 p-0.5 cursor-pointer focus:outline-hidden ${
                      locked
                        ? 'bg-brand/50 cursor-not-allowed opacity-75'
                        : isChecked
                        ? 'bg-brand shadow-xs'
                        : 'bg-neutral-300 dark:bg-neutral-700 border border-neutral-400/40 dark:border-neutral-600/40'
                    }`}
                  >
                    <span
                      className={`block w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                        isChecked ? 'translate-x-5.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-line bg-surface shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            className="flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            id="save-preferences-btn"
            disabled={loading || saving}
            onClick={handleSave}
            className="flex-1 sm:flex-initial shadow-xs"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
}
