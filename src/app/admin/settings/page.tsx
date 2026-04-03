'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/utils/toast'
import { Button } from '@/components/ui/Button'
import { useApi } from '@/hooks/useApi'
import { DEFAULT_AUTH } from '@/hooks/useSettings'
import type {
  SettingsResponse,
  SocialSettingsValues,
  SystemSettingsValues,
  LocaleSettingsValues,
  UploadSettingsValues,
  AuthSettingsValues,
  AdminSettingsValues,
  PaymentSettingsValues,
  SettingsCategory,
} from '@/types/settings'
import {
  Globe,
  Image,
  Lock,
  MessageSquare,
  Settings as SettingsIcon,
  CreditCard,
  Shield,
  Info,
  Trash2,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

type TabId = 'system' | 'social' | 'locale' | 'upload' | 'auth' | 'admin' | 'payment'

interface Tab {
  id: TabId
  labelKey: string
  icon: React.ComponentType<{ size?: number }>
}

const TABS: Tab[] = [
  { id: 'system', labelKey: 'tabs.system', icon: SettingsIcon },
  { id: 'social', labelKey: 'tabs.social', icon: MessageSquare },
  { id: 'locale', labelKey: 'tabs.locale', icon: Globe },
  { id: 'upload', labelKey: 'tabs.upload', icon: Image },
  { id: 'auth', labelKey: 'tabs.auth', icon: Lock },
  { id: 'admin', labelKey: 'tabs.admin', icon: Shield },
  { id: 'payment', labelKey: 'tabs.payment', icon: CreditCard },
]

export default function SettingsPage() {
  const t = useTranslations('admin.settings')
  const [activeTab, setActiveTab] = useState<TabId>('system')

  // API hooks
  const settingsApi = useApi<{ settings: SettingsResponse }>('/api/admin/settings', 'GET')
  const updateSettingsApi = useApi<{ settings: SettingsResponse }>('/api/admin/settings', 'PUT')

  // Form states for each category
  const [socialForm, setSocialForm] = useState<SocialSettingsValues | null>(null)
  const [systemForm, setSystemForm] = useState<SystemSettingsValues | null>(null)
  const [localeForm, setLocaleForm] = useState<LocaleSettingsValues | null>(null)
  const [uploadForm, setUploadForm] = useState<UploadSettingsValues | null>(null)
  const [authForm, setAuthForm] = useState<AuthSettingsValues | null>(null)
  const [adminForm, setAdminForm] = useState<AdminSettingsValues | null>(null)
  const [paymentForm, setPaymentForm] = useState<PaymentSettingsValues | null>(null)

  // Load settings on mount and update forms when data loads
  useEffect(() => {
    const fetchSettings = async () => {
      const { success, data } = await settingsApi.request(undefined)
      if (success && data) {
        const s = data.settings
        setSocialForm(s.social)
        setSystemForm(s.system)
        setLocaleForm(s.locale)
        setUploadForm(s.upload)
        setAuthForm({ ...DEFAULT_AUTH, ...s.auth })
        setAdminForm(s.admin)
        setPaymentForm(s.payment)
      }
    }
    fetchSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save handler
  const handleSave = useCallback(async () => {
    const category = activeTab as SettingsCategory
    let updates: Record<string, unknown>

    switch (activeTab) {
      case 'social':
        updates = (socialForm ?? {}) as Record<string, unknown>
        break
      case 'system':
        updates = (systemForm ?? {}) as Record<string, unknown>
        break
      case 'locale':
        updates = (localeForm ?? {}) as Record<string, unknown>
        break
      case 'upload':
        updates = (uploadForm ?? {}) as Record<string, unknown>
        break
      case 'auth':
        updates = (authForm ?? {}) as Record<string, unknown>
        break
      case 'admin':
        updates = (adminForm ?? {}) as Record<string, unknown>
        break
      case 'payment':
        updates = (paymentForm ?? {}) as Record<string, unknown>
        break
      default:
        return
    }

    const res = await updateSettingsApi.request(
      { category, updates },
      { onError: (err: string) => toast.error(err) }
    )

    if (res.success) {
      toast.success(t('save_success'))
      await settingsApi.request()
    }
  }, [
    activeTab,
    socialForm,
    systemForm,
    localeForm,
    uploadForm,
    authForm,
    adminForm,
    paymentForm,
    updateSettingsApi,
    settingsApi,
    t,
  ])

  if (settingsApi.loading && !socialForm) {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!socialForm) {
    return (
      <div className="flex justify-center py-12">
        <span className="text-error">{t('load_error')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-base-content/70">{t('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-100 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab gap-2 ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-base-100 rounded-box border border-base-300 p-6">
        {activeTab === 'social' && (
          <SocialSettings form={socialForm} setForm={setSocialForm} t={t} />
        )}
        {activeTab === 'system' && (
          <SystemSettings form={systemForm} setForm={setSystemForm} t={t} />
        )}
        {activeTab === 'locale' && (
          <LocaleSettings form={localeForm} setForm={setLocaleForm} t={t} />
        )}
        {activeTab === 'upload' && (
          <UploadSettings form={uploadForm} setForm={setUploadForm} t={t} />
        )}
        {activeTab === 'auth' && <AuthSettings form={authForm} setForm={setAuthForm} t={t} />}
        {activeTab === 'admin' && (
          <AdminSettings form={adminForm} setForm={setAdminForm} t={t} />
        )}
        {activeTab === 'payment' && (
          <PaymentSettings form={paymentForm} setForm={setPaymentForm} t={t} />
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={() => void handleSave()} loading={updateSettingsApi.loading}>
          {t('save')}
        </Button>
      </div>
    </div>
  )
}

// ============ Social Settings ============
function SocialSettings({
  form,
  setForm,
  t,
}: {
  form: SocialSettingsValues | null
  setForm: React.Dispatch<React.SetStateAction<SocialSettingsValues | null>>
  t: ReturnType<typeof useTranslations>
}) {
  if (!form) return null

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend text-lg font-semibold">{t('social_section')}</legend>

      <label className="label cursor-pointer justify-start gap-4">
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={form.enableComments}
          onChange={e =>
            setForm(prev => (prev ? { ...prev, enableComments: e.target.checked } : null))
          }
        />
        <span className="label-text">{t('enable_comments')}</span>
      </label>

      <label className="label cursor-pointer justify-start gap-4">
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={form.commentRequireApproval}
          onChange={e =>
            setForm(prev => (prev ? { ...prev, commentRequireApproval: e.target.checked } : null))
          }
        />
        <span className="label-text">{t('require_approval')}</span>
      </label>

      <label className="label mt-4">
        <span className="label-text">{t('max_comment_length')}</span>
      </label>
      <input
        type="number"
        className="input input-bordered w-32"
        value={form.maxCommentLength}
        onChange={e =>
          setForm(prev =>
            prev ? { ...prev, maxCommentLength: parseInt(e.target.value) || 0 } : null
          )
        }
        min={100}
        max={10000}
      />

      <legend className="fieldset-legend text-lg font-semibold mt-6">{t('replies_section')}</legend>

      <label className="label cursor-pointer justify-start gap-4">
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={form.replyRequireApproval}
          onChange={e =>
            setForm(prev => (prev ? { ...prev, replyRequireApproval: e.target.checked } : null))
          }
        />
        <span className="label-text">{t('reply_require_approval')}</span>
      </label>

      <label className="label mt-4">
        <span className="label-text">{t('max_reply_length')}</span>
      </label>
      <input
        type="number"
        className="input input-bordered w-32"
        value={form.maxReplyLength}
        onChange={e =>
          setForm(prev =>
            prev ? { ...prev, maxReplyLength: parseInt(e.target.value) || 0 } : null
          )
        }
        min={100}
        max={5000}
      />

      <legend className="fieldset-legend text-lg font-semibold mt-6">{t('likes_section')}</legend>

      <label className="label cursor-pointer justify-start gap-4">
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={form.enableLikes}
          onChange={e =>
            setForm(prev => (prev ? { ...prev, enableLikes: e.target.checked } : null))
          }
        />
        <span className="label-text">{t('enable_likes')}</span>
      </label>

      <legend className="fieldset-legend text-lg font-semibold mt-6">
        {t('sensitive_words_section')}
      </legend>

      <textarea
        className="textarea textarea-bordered w-full h-32"
        value={form.sensitiveWords}
        onChange={e => setForm(prev => (prev ? { ...prev, sensitiveWords: e.target.value } : null))}
        placeholder={t('sensitive_words_placeholder')}
      />
      <p className="label-text text-base-content/60">{t('sensitive_words_hint')}</p>
    </fieldset>
  )
}

// ============ System Settings ============
function SystemSettings({
  form,
  setForm,
  t,
}: {
  form: SystemSettingsValues | null
  setForm: React.Dispatch<React.SetStateAction<SystemSettingsValues | null>>
  t: ReturnType<typeof useTranslations>
}) {
  if (!form) return null

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend text-lg font-semibold">{t('system_section')}</legend>

      <label className="label">
        <span className="label-text">{t('support_email')}</span>
      </label>
      <input
        type="email"
        className="input input-bordered w-full max-w-md"
        value={form.supportEmail}
        onChange={e => setForm(prev => (prev ? { ...prev, supportEmail: e.target.value } : null))}
      />

      <label className="label">
        <span className="label-text">{t('favicon')}</span>
      </label>
      <input
        type="text"
        className="input input-bordered w-full max-w-md"
        value={form.favicon}
        onChange={e => setForm(prev => (prev ? { ...prev, favicon: e.target.value } : null))}
      />
    </fieldset>
  )
}

// ============ Locale Settings ============
function LocaleSettings({
  form,
  setForm,
  t,
}: {
  form: LocaleSettingsValues | null
  setForm: React.Dispatch<React.SetStateAction<LocaleSettingsValues | null>>
  t: ReturnType<typeof useTranslations>
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [newLang, setNewLang] = useState({ value: '', label: '', nativeName: '' })

  if (!form) return null

  const handleAddLanguage = () => {
    if (!newLang.value || !newLang.label || !newLang.nativeName) return

    // Check if language already exists
    if (form.supported.some(l => l.value === newLang.value)) {
      toast.error(t('language_exists'))
      return
    }

    setForm(prev => prev ? {
      ...prev,
      supported: [...prev.supported, { ...newLang }],
    } : null)

    setNewLang({ value: '', label: '', nativeName: '' })
    setShowAddModal(false)
    toast.success(t('language_added'))
  }

  const handleRemoveLanguage = (value: string) => {
    if (form.supported.length <= 1) {
      toast.error(t('cannot_remove_last_language'))
      return
    }
    setForm(prev => prev ? {
      ...prev,
      supported: prev.supported.filter(l => l.value !== value),
      default: prev.default === value ? '' : prev.default,
    } : null)
  }

  return (
    <>
      <fieldset className="fieldset">
        <legend className="fieldset-legend text-lg font-semibold">{t('locale_section')}</legend>

        {/* Tip Alert */}
        <div className="alert alert-info mb-4">
          <Info size={18} />
          <span>{t('add_language_tip')}</span>
        </div>

        <label className="label">
          <span className="label-text">{t('default_locale')}</span>
        </label>
        <select
          className="select select-bordered w-full max-w-xs"
          value={form.default}
          onChange={e => setForm(prev => (prev ? { ...prev, default: e.target.value } : null))}
        >
          <option value="">{t('auto_detect')}</option>
          {form.supported.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label} ({lang.nativeName})
            </option>
          ))}
        </select>

        {/* Supported Languages */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <span className="label-text font-medium">{t('supported_languages')}</span>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              {t('add_language')}
            </Button>
          </div>
          <div className="space-y-2">
            {form.supported.map(lang => (
              <div key={lang.value} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                <div>
                  <span className="font-medium">{lang.label}</span>
                  <span className="text-base-content/60 ml-2">({lang.nativeName})</span>
                  <span className="badge badge-ghost badge-sm ml-2">{lang.value}</span>
                </div>
                <button
                  className="btn btn-sm btn-ghost btn-circle text-error"
                  onClick={() => handleRemoveLanguage(lang.value)}
                  title={t('remove_language')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </fieldset>

      {/* Add Language Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={t('add_language_title')}>
        <div className="space-y-4">
          {/* Tip */}
          <div className="alert alert-warning">
            <Info size={18} />
            <span>{t('add_language_tip')}</span>
          </div>

          <label className="label">
            <span className="label-text">{t('language_code')}</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder={t('language_code_placeholder')}
            value={newLang.value}
            onChange={e => setNewLang(prev => ({ ...prev, value: e.target.value.toLowerCase() }))}
            maxLength={10}
          />

          <label className="label">
            <span className="label-text">{t('language_label')}</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder={t('language_label_placeholder')}
            value={newLang.label}
            onChange={e => setNewLang(prev => ({ ...prev, label: e.target.value }))}
          />

          <label className="label">
            <span className="label-text">{t('language_native_name')}</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder={t('language_native_name_placeholder')}
            value={newLang.nativeName}
            onChange={e => setNewLang(prev => ({ ...prev, nativeName: e.target.value }))}
          />

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={() => void handleAddLanguage()}
              disabled={!newLang.value || !newLang.label || !newLang.nativeName}
            >
              {t('add')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ============ Upload Settings ============
function UploadSettings({
  form,
  setForm,
  t,
}: {
  form: UploadSettingsValues | null
  setForm: React.Dispatch<React.SetStateAction<UploadSettingsValues | null>>
  t: ReturnType<typeof useTranslations>
}) {
  if (!form) return null

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend text-lg font-semibold">{t('upload_section')}</legend>

      <label className="label">
        <span className="label-text">{t('max_image_size')}</span>
      </label>
      <input
        type="number"
        className="input input-bordered w-32"
        value={form.imageMaxSizeMB}
        onChange={e =>
          setForm(prev => (prev ? { ...prev, imageMaxSizeMB: parseInt(e.target.value) || 1 } : null))
        }
        min={1}
        max={100}
      />
      <p className="label-text text-base-content/60">{t('max_size_hint_mb')}</p>

      <label className="label mt-4">
        <span className="label-text">{t('allowed_types')}</span>
      </label>
      <input
        type="text"
        className="input input-bordered w-full"
        value={form.imageAllowedTypes.join(', ')}
        onChange={e =>
          setForm(prev =>
            prev
              ? {
                  ...prev,
                  imageAllowedTypes: e.target.value
                    .split(',')
                    .map(t => t.trim())
                    .filter(Boolean),
                }
              : null
          )
        }
      />
      <p className="label-text text-base-content/60">{t('allowed_types_hint')}</p>
    </fieldset>
  )
}

// ============ Auth Settings ============
function AuthSettings({
  form,
  setForm,
  t,
}: {
  form: AuthSettingsValues | null
  setForm: React.Dispatch<React.SetStateAction<AuthSettingsValues | null>>
  t: ReturnType<typeof useTranslations>
}) {
  if (!form) return null

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend text-lg font-semibold">{t('auth_section')}</legend>

      <label className="label cursor-pointer justify-start gap-4">
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={form.loginLimitsEnabled}
          onChange={e =>
            setForm(prev => (prev ? { ...prev, loginLimitsEnabled: e.target.checked } : null))
          }
        />
        <span className="label-text">{t('enable_login_limits')}</span>
      </label>

      {form.loginLimitsEnabled && (
        <>
          <label className="label mt-4">
            <span className="label-text">{t('max_attempts')}</span>
          </label>
          <input
            type="number"
            className="input input-bordered w-32"
            value={form.loginLimitsMaxAttempts}
            onChange={e =>
              setForm(prev =>
                prev ? { ...prev, loginLimitsMaxAttempts: parseInt(e.target.value) || 0 } : null
              )
            }
            min={1}
            max={100}
          />

          <label className="label mt-4">
            <span className="label-text">{t('window_minutes')}</span>
          </label>
          <input
            type="number"
            className="input input-bordered w-32"
            value={form.loginLimitsWindowMinutes}
            onChange={e =>
              setForm(prev =>
                prev ? { ...prev, loginLimitsWindowMinutes: parseInt(e.target.value) || 0 } : null
              )
            }
            min={1}
            max={1440}
          />
        </>
      )}

      <label className="label mt-4">
        <span className="label-text">{t('password_min_strength')}</span>
      </label>
      <select
        className="select select-bordered w-full max-w-xs"
        value={form.passwordMinStrength}
        onChange={e =>
          setForm(prev =>
            prev
              ? { ...prev, passwordMinStrength: e.target.value as 'weak' | 'medium' | 'strong' }
              : null
          )
        }
      >
        <option value="weak">{t('strength_weak')}</option>
        <option value="medium">{t('strength_medium')}</option>
        <option value="strong">{t('strength_strong')}</option>
      </select>
    </fieldset>
  )
}

// ============ Payment Settings ============
function PaymentSettings({
  form,
  setForm,
  t,
}: {
  form: PaymentSettingsValues | null
  setForm: React.Dispatch<React.SetStateAction<PaymentSettingsValues | null>>
  t: ReturnType<typeof useTranslations>
}) {
  if (!form) return null

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend text-lg font-semibold">{t('payment_section')}</legend>

      <label className="label">
        <span className="label-text">{t('default_currency')}</span>
      </label>
      <select
        className="select select-bordered w-full max-w-xs"
        value={form.defaultCurrency}
        onChange={e =>
          setForm(prev => (prev ? { ...prev, defaultCurrency: e.target.value } : null))
        }
      >
        {form.currencies.map(c => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <label className="label mt-4">
        <span className="label-text">{t('default_mode')}</span>
      </label>
      <select
        className="select select-bordered w-full max-w-xs"
        value={form.defaultMode}
        onChange={e => setForm(prev => (prev ? { ...prev, defaultMode: e.target.value } : null))}
      >
        {form.modes.map(m => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      <label className="label mt-4">
        <span className="label-text">{t('default_interval')}</span>
      </label>
      <select
        className="select select-bordered w-full max-w-xs"
        value={form.defaultInterval}
        onChange={e =>
          setForm(prev => (prev ? { ...prev, defaultInterval: e.target.value } : null))
        }
      >
        {form.intervals.map(i => (
          <option key={i.value} value={i.value}>
            {i.label}
          </option>
        ))}
      </select>
    </fieldset>
  )
}

// ============ Admin Settings ============
function AdminSettings({
  form,
  setForm,
  t,
}: {
  form: AdminSettingsValues | null
  setForm: React.Dispatch<React.SetStateAction<AdminSettingsValues | null>>
  t: ReturnType<typeof useTranslations>
}) {
  if (!form) return null

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend text-lg font-semibold">{t('admin_section')}</legend>

      <label className="label">
        <span className="label-text">{t('admin_page_size')}</span>
      </label>
      <input
        type="number"
        className="input input-bordered w-32"
        value={form.pageSize}
        onChange={e =>
          setForm(prev => (prev ? { ...prev, pageSize: parseInt(e.target.value) || 10 } : null))
        }
        min={5}
        max={100}
      />

      <label className="label mt-4">
        <span className="label-text">{t('admin_password_min_strength')}</span>
      </label>
      <select
        className="select select-bordered w-full max-w-xs"
        value={form.passwordMinStrength}
        onChange={e =>
          setForm(prev =>
            prev ? { ...prev, passwordMinStrength: e.target.value as 'weak' | 'medium' | 'strong' } : null
          )
        }
      >
        <option value="weak">{t('strength_weak')}</option>
        <option value="medium">{t('strength_medium')}</option>
        <option value="strong">{t('strength_strong')}</option>
      </select>

      <label className="label mt-4">
        <span className="label-text">{t('admin_import_limits')}</span>
      </label>
      <input
        type="number"
        className="input input-bordered w-32"
        value={form.articlesImportLimits}
        onChange={e =>
          setForm(prev => (prev ? { ...prev, articlesImportLimits: parseInt(e.target.value) || 10 } : null))
        }
        min={1}
        max={100}
      />
    </fieldset>
  )
}
