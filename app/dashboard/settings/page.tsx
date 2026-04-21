//app\dashboard\settings\page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useTheme } from "@/components/providers/AppProviders";
import RoleGuard from "@/components/auth/RoleGuard";
import { CheckCircle2, XCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabName = "General" | "Security" | "Notifications" | "Integrations" | "Danger Zone";

const TABS: TabName[] = ["General", "Security", "Notifications", "Integrations", "Danger Zone"];

interface OrgSettings {
  orgName:     string;
  udyamCode:   string;
  adminEmail:  string;
  timezone:    string;
  language:    string;
}

interface SecuritySettings {
  twoFactor:    boolean;
  sessionTimeout: string;
  ipAllowlist:  boolean;
  auditLogs:    boolean;
}

interface NotifSettings {
  serviceDown:  boolean;
  newSignup:    boolean;
  overdueInvoice: boolean;
  weeklySummary: boolean;
  securityEvents: boolean;
  notifEmail:   string;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!value)}
      className="w-11 h-6 rounded-full relative cursor-pointer transition-colors shrink-0 border"
      style={{
        background:   value ? "var(--orange)" : "var(--border)",
        borderColor:  value ? "var(--orange)" : "var(--border)",
      }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
        style={{
          left:       value ? "1.5rem" : "0.125rem",
          background: value ? "#fff" : "var(--ink-dim)",
          boxShadow:  value ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
        }}
      />
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-6 py-4 border-b border-border last:border-none">
      <div className="flex-1">
        <div className="text-sm text-ink font-sans font-medium">{label}</div>
        {desc && <div className="text-xs text-ink-muted mt-1 font-sans">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function FieldInput({ value, onChange, type = "text", placeholder }: {
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      readOnly={!onChange}
      className="bg-surface2 border border-border text-ink px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-mono w-full sm:w-60 focus:border-orange outline-none transition-colors"
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const DEFAULT_ORG: OrgSettings = {
  orgName:    "Navkon",
  udyamCode:  "UDYAM-MH-33-0750188",
  adminEmail: "admin@navkon.io",
  timezone:   "Asia/Kolkata (IST)",
  language:   "English (US)",
};

const DEFAULT_SECURITY: SecuritySettings = {
  twoFactor:      true,
  sessionTimeout: "30 minutes",
  ipAllowlist:    false,
  auditLogs:      true,
};

const DEFAULT_NOTIF: NotifSettings = {
  serviceDown:    true,
  newSignup:      true,
  overdueInvoice: true,
  weeklySummary:  false,
  securityEvents: true,
  notifEmail:     "admin@navkon.io",
};

export default function SettingsPage() {
  const { dark, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabName>("General");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  // Per-tab state
  const [org, setOrg]           = useState<OrgSettings>(DEFAULT_ORG);
  const [security, setSecurity] = useState<SecuritySettings>(DEFAULT_SECURITY);
  const [notif, setNotif]       = useState<NotifSettings>(DEFAULT_NOTIF);
  const [apiKey]                = useState("sk-navkon-xxxxxxxxxxx");
  const [apiRevealed, setApiRevealed] = useState(false);

  // ── Load settings from Firestore ──────────────────────────────────────────

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "settings"), (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.org)      setOrg(d.org as OrgSettings);
      if (d.security) setSecurity(d.security as SecuritySettings);
      if (d.notif)    setNotif(d.notif as NotifSettings);
    });
    return () => unsub();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const saveSection = async (section: "org" | "security" | "notif", data: object) => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, "config", "settings"),
        { [section]: data, updatedAt: serverTimestamp() },
        { merge: true }
      );
      showToast("Settings saved", true);
    } catch (err) {
      console.error("Settings save error:", err);
      showToast("Failed to save settings.", false);
    } finally {
      setSaving(false);
    }
  };

  const SaveButton = ({ label, section, data }: { label: string; section: "org" | "security" | "notif"; data: object }) => (
    <div className="mt-6 sm:mt-8">
      <button
        onClick={() => saveSection(section, data)}
        disabled={saving}
        className="w-full sm:w-auto bg-orange hover:opacity-90 disabled:opacity-60 text-white px-6 sm:px-8 py-3 rounded-xl text-sm font-sans font-medium transition-all shadow-lg active:scale-95 flex items-center gap-2"
      >
        {saving && <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        {label}
      </button>
    </div>
  );

  // ── Tab contents ──────────────────────────────────────────────────────────

  const renderTab = () => {
    if (activeTab === "General") return (
      <div>
        <SettingRow label="Organization Name" desc="Displayed in the admin panel and email footers.">
          <FieldInput value={org.orgName} onChange={(v) => setOrg({ ...org, orgName: v })} />
        </SettingRow>
        <SettingRow label="UDYAM / MSME Code" desc="Displayed on all invoices and legal documents.">
          <FieldInput value={org.udyamCode} onChange={(v) => setOrg({ ...org, udyamCode: v })} />
        </SettingRow>
        <SettingRow label="Admin Email" desc="Used for system notifications and account recovery.">
          <FieldInput value={org.adminEmail} onChange={(v) => setOrg({ ...org, adminEmail: v })} type="email" />
        </SettingRow>
        <SettingRow label="Timezone" desc="Affects all timestamp displays and scheduled tasks.">
          <select
            value={org.timezone}
            onChange={(e) => setOrg({ ...org, timezone: e.target.value })}
            className="bg-surface2 border border-border text-ink px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-mono focus:border-orange outline-none w-full sm:min-w-48 transition-colors"
          >
            <option>Asia/Kolkata (IST)</option>
            <option>America/New_York (EST)</option>
            <option>Europe/London (GMT)</option>
            <option>UTC</option>
          </select>
        </SettingRow>
        <SettingRow label="Language">
          <FieldInput value={org.language} onChange={(v) => setOrg({ ...org, language: v })} />
        </SettingRow>
        <SettingRow label="Dark Mode" desc="Toggle between light and dark interface themes.">
          <Toggle value={dark} onChange={(isDark) => setTheme(isDark ? "dark" : "light")} />
        </SettingRow>
        <SaveButton label="Save Changes" section="org" data={org} />
      </div>
    );

    if (activeTab === "Security") return (
      <div>
        <SettingRow label="Two-Factor Authentication" desc="Require 2FA for all admin accounts.">
          <Toggle value={security.twoFactor} onChange={(v) => setSecurity({ ...security, twoFactor: v })} />
        </SettingRow>
        <SettingRow label="Session Timeout" desc="Automatically log out after inactivity period.">
          <select
            value={security.sessionTimeout}
            onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
            className="bg-surface2 border border-border text-ink px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-mono focus:border-orange outline-none w-full sm:min-w-48 transition-colors"
          >
            <option>30 minutes</option>
            <option>1 hour</option>
            <option>4 hours</option>
            <option>Never</option>
          </select>
        </SettingRow>
        <SettingRow label="API Key" desc="Use this key to authenticate with the Navkon API.">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <input
              type={apiRevealed ? "text" : "password"}
              value={apiKey}
              readOnly
              className="bg-surface2 border border-border text-ink-muted px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm w-full sm:w-56 font-mono focus:border-orange outline-none transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setApiRevealed((v) => !v)}
                className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 border border-border text-ink-muted hover:border-orange hover:text-orange rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all"
              >
                {apiRevealed ? "Hide" : "Reveal"}
              </button>
              <button className="flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 border border-red text-red hover:bg-red-dim rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all">
                Rotate
              </button>
            </div>
          </div>
        </SettingRow>
        <SettingRow label="IP Allowlist" desc="Restrict access to specific IP addresses only.">
          <Toggle value={security.ipAllowlist} onChange={(v) => setSecurity({ ...security, ipAllowlist: v })} />
        </SettingRow>
        <SettingRow label="Audit Logs" desc="Store and export a log of all admin actions.">
          <Toggle value={security.auditLogs} onChange={(v) => setSecurity({ ...security, auditLogs: v })} />
        </SettingRow>
        <SaveButton label="Save Security Settings" section="security" data={security} />
      </div>
    );

    if (activeTab === "Notifications") return (
      <div>
        <SettingRow label="Service Down Alerts" desc="Notify when a service changes to Stopped or Degraded.">
          <Toggle value={notif.serviceDown} onChange={(v) => setNotif({ ...notif, serviceDown: v })} />
        </SettingRow>
        <SettingRow label="New Account Signup" desc="Get notified when a new account is created.">
          <Toggle value={notif.newSignup} onChange={(v) => setNotif({ ...notif, newSignup: v })} />
        </SettingRow>
        <SettingRow label="Overdue Invoice Alerts" desc="Trigger when an invoice passes its due date.">
          <Toggle value={notif.overdueInvoice} onChange={(v) => setNotif({ ...notif, overdueInvoice: v })} />
        </SettingRow>
        <SettingRow label="Weekly Summary" desc="Receive a weekly digest of activity and metrics.">
          <Toggle value={notif.weeklySummary} onChange={(v) => setNotif({ ...notif, weeklySummary: v })} />
        </SettingRow>
        <SettingRow label="Security Events" desc="Alert on suspicious login attempts or IP blocks.">
          <Toggle value={notif.securityEvents} onChange={(v) => setNotif({ ...notif, securityEvents: v })} />
        </SettingRow>
        <SettingRow label="Notification Email" desc="Recipient address for all automated emails.">
          <FieldInput
            value={notif.notifEmail}
            onChange={(v) => setNotif({ ...notif, notifEmail: v })}
            type="email"
          />
        </SettingRow>
        <SaveButton label="Save Notification Preferences" section="notif" data={notif} />
      </div>
    );

    if (activeTab === "Integrations") {
      const integrations = [
        { name: "Slack",     desc: "Send alerts and notifications to Slack channels",  icon: "💬", connected: true  },
        { name: "GitHub",    desc: "Link deployments to repository commits",            icon: "🐙", connected: false },
        { name: "Datadog",   desc: "Forward metrics and logs to Datadog",               icon: "📊", connected: true  },
        { name: "PagerDuty", desc: "Trigger on-call alerts for critical failures",      icon: "🚨", connected: false },
        { name: "Stripe",    desc: "Sync billing events with Stripe webhooks",          icon: "💳", connected: true  },
      ];
      return (
        <div className="space-y-3">
          {integrations.map((intg) => (
            <div
              key={intg.name}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 bg-surface2 border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all hover:border-orange-border"
            >
              <div className="text-2xl sm:text-3xl">{intg.icon}</div>
              <div className="flex-1">
                <div className="font-sans font-medium text-ink">{intg.name}</div>
                <div className="text-xs sm:text-sm text-ink-muted mt-1 font-sans">{intg.desc}</div>
              </div>
              {intg.connected ? (
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-3 sm:px-4 py-1 bg-green-dim text-green border border-green-border rounded-full">
                    Connected
                  </span>
                  <button className="px-4 sm:px-5 py-1.5 sm:py-2 text-[10px] font-mono uppercase tracking-wider border border-border hover:border-orange hover:text-orange rounded-xl transition-all">
                    Disconnect
                  </button>
                </div>
              ) : (
                <button className="w-full sm:w-auto px-5 sm:px-6 py-1.5 sm:py-2 text-[10px] font-mono uppercase tracking-wider border border-orange-border text-orange hover:bg-orange-dim rounded-xl transition-all">
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "Danger Zone") return (
      <div className="space-y-3 sm:space-y-4">
        {[
          { title: "Reset All Settings",  desc: "Revert all configuration to factory defaults. This cannot be undone.",        btnLabel: "Reset",  fill: false },
          { title: "Revoke All API Keys", desc: "Immediately invalidate all active API tokens. All integrations will break.",   btnLabel: "Revoke", fill: false },
          { title: "Delete Organization", desc: "Permanently delete this organization and all associated data. Irreversible.",  btnLabel: "Delete", fill: true  },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-red-dim border border-red rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
          >
            <div className="flex-1">
              <div className="font-sans font-bold text-red text-sm sm:text-base">{item.title}</div>
              <div className="text-xs sm:text-sm text-ink-muted mt-1 sm:mt-2 font-sans">{item.desc}</div>
            </div>
            <button
              className={`w-full sm:w-auto px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all active:scale-95 ${
                item.fill
                  ? "bg-red text-white hover:opacity-90"
                  : "border border-red text-red hover:bg-red-dim"
              }`}
            >
              {item.btnLabel}
            </button>
          </div>
        ))}
      </div>
    );

    return null;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <RoleGuard page="Settings">
      <div className="text-ink">

        {/* Toast */}
        {toast && (
          <div
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl font-sans text-sm"
            style={{
              background:  toast.ok ? "var(--green-dim)" : "var(--red-dim)",
              borderColor: toast.ok ? "var(--green-border)" : "var(--red)",
              color:       toast.ok ? "var(--green)" : "var(--red)",
            }}
          >
            {toast.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tighter text-ink">Settings</h1>
          <div className="flex items-center gap-2 sm:gap-3 mt-2">
            <div className="h-px w-5 sm:w-7 bg-green rounded-full" />
            <p className="text-ink-muted text-xs sm:text-sm font-sans font-light">
              Configure application preferences and system behavior
            </p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl sm:rounded-2xl overflow-hidden shadow-sm">
          {/* Tab Bar */}
          <div className="flex border-b border-border bg-surface2 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-xs font-mono uppercase tracking-wider sm:tracking-widest border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "text-orange border-orange"
                    : "text-ink-muted border-transparent hover:text-ink-soft"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-4 sm:p-8">
            {renderTab()}
          </div>
        </div>

      </div>
    </RoleGuard>
  );
}