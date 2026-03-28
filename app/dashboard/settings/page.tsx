"use client";

import { useState } from "react";

const tabs = ["General", "Security", "Notifications", "Integrations", "Danger Zone"] as const;
type TabName = typeof tabs[number];

function Toggle({ defaultOn = false, onChange }: { defaultOn?: boolean; onChange?: (val: boolean) => void }) {
  const [on, setOn] = useState(defaultOn);
  const handleClick = () => {
    const next = !on;
    setOn(next);
    onChange?.(next);
  };
  return (
    <div
      onClick={handleClick}
      className="w-11 h-6 rounded-full relative cursor-pointer transition-colors shrink-0 border"
      style={{
        background: on ? "var(--orange)" : "var(--border)",
        borderColor: on ? "var(--orange)" : "var(--border)",
      }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
        style={{
          left: on ? "1.5rem" : "0.125rem",
          background: on ? "#fff" : "var(--ink-dim)",
          boxShadow: on ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
        }}
      />
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-border last:border-none">
      <div>
        <div className="text-sm text-ink font-sans font-medium">{label}</div>
        {desc && <div className="text-xs text-ink-muted mt-1 max-w-md font-sans">{desc}</div>}
      </div>
      <div className="shrink-0 ml-6">{children}</div>
    </div>
  );
}

function FieldInput({ placeholder, defaultValue, type = "text" }: {
  placeholder?: string; defaultValue?: string; type?: string;
}) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="bg-surface2 border border-border text-ink px-4 py-2.5 rounded-xl text-sm font-mono w-60 focus:border-orange outline-none transition-colors"
    />
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabName>("General");
  const [, setThemeKey] = useState(0);

  const saveButton = (label: string) => (
    <div className="mt-8">
      <button className="bg-orange hover:opacity-90 text-white px-8 py-3 rounded-xl text-sm font-sans font-medium transition-all shadow-lg active:scale-95">
        {label}
      </button>
    </div>
  );

  const TabContent = ({ tab }: { tab: TabName }) => {
    if (tab === "General") return (
      <div>
        <SettingRow label="Organization Name" desc="Displayed in the admin panel and email footers.">
          <FieldInput defaultValue="Navkon" />
        </SettingRow>
        <SettingRow label="UDYAM / MSME Code" desc="Displayed on all invoices and legal documents.">
          <FieldInput defaultValue="UDYAM-MH-33-0750188" />
        </SettingRow>
        <SettingRow label="Admin Email" desc="Used for system notifications and account recovery.">
          <FieldInput defaultValue="admin@navkon.io" type="email" />
        </SettingRow>
        <SettingRow label="Timezone" desc="Affects all timestamp displays and scheduled tasks.">
          <select className="bg-surface2 border border-border text-ink px-4 py-2.5 rounded-xl text-sm font-mono focus:border-orange outline-none min-w-48 transition-colors">
            <option>Asia/Kolkata (IST)</option>
            <option>America/New_York (EST)</option>
            <option>Europe/London (GMT)</option>
            <option>UTC</option>
          </select>
        </SettingRow>
        <SettingRow label="Language">
          <FieldInput defaultValue="English (US)" />
        </SettingRow>
        <SettingRow label="Dark Mode" desc="Toggle between light and dark interface themes.">
          <Toggle
            defaultOn={typeof window !== "undefined" ? localStorage.getItem("navkon_theme") !== "light" : true}
            onChange={(isDark) => {
              localStorage.setItem("navkon_theme", isDark ? "dark" : "light");
              setThemeKey((k) => k + 1);
              window.dispatchEvent(new StorageEvent("storage", {
                key: "navkon_theme",
                newValue: isDark ? "dark" : "light",
              }));
            }}
          />
        </SettingRow>
        {saveButton("Save Changes")}
      </div>
    );

    if (tab === "Security") return (
      <div>
        <SettingRow label="Two-Factor Authentication" desc="Require 2FA for all admin accounts.">
          <Toggle defaultOn />
        </SettingRow>
        <SettingRow label="Session Timeout" desc="Automatically log out after inactivity period.">
          <select className="bg-surface2 border border-border text-ink px-4 py-2.5 rounded-xl text-sm font-mono focus:border-orange outline-none min-w-48 transition-colors">
            <option>30 minutes</option>
            <option>1 hour</option>
            <option>4 hours</option>
            <option>Never</option>
          </select>
        </SettingRow>
        <SettingRow label="API Key" desc="Use this key to authenticate with the Navkon API.">
          <div className="flex gap-3">
            <input
              type="password"
              defaultValue="sk-navkon-xxxxxxxxxxx"
              className="bg-surface2 border border-border text-ink-muted px-4 py-2.5 rounded-xl text-sm w-56 font-mono focus:border-orange outline-none transition-colors"
            />
            <button className="px-5 py-2.5 border border-border text-ink-muted hover:border-orange hover:text-orange rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all">
              Reveal
            </button>
            <button className="px-5 py-2.5 border border-red text-red hover:bg-red-dim rounded-xl text-[10px] font-mono uppercase tracking-wider transition-all">
              Rotate
            </button>
          </div>
        </SettingRow>
        <SettingRow label="IP Allowlist" desc="Restrict access to specific IP addresses only.">
          <Toggle />
        </SettingRow>
        <SettingRow label="Audit Logs" desc="Store and export a log of all admin actions.">
          <Toggle defaultOn />
        </SettingRow>
        {saveButton("Save Security Settings")}
      </div>
    );

    if (tab === "Notifications") return (
      <div>
        <SettingRow label="Service Down Alerts" desc="Notify when a service changes to Stopped or Degraded.">
          <Toggle defaultOn />
        </SettingRow>
        <SettingRow label="New Account Signup" desc="Get notified when a new account is created.">
          <Toggle defaultOn />
        </SettingRow>
        <SettingRow label="Overdue Invoice Alerts" desc="Trigger when an invoice passes its due date.">
          <Toggle defaultOn />
        </SettingRow>
        <SettingRow label="Weekly Summary" desc="Receive a weekly digest of activity and metrics.">
          <Toggle />
        </SettingRow>
        <SettingRow label="Security Events" desc="Alert on suspicious login attempts or IP blocks.">
          <Toggle defaultOn />
        </SettingRow>
        <SettingRow label="Notification Email" desc="Recipient address for all automated emails.">
          <FieldInput defaultValue="admin@navkon.io" type="email" />
        </SettingRow>
        {saveButton("Save Notification Preferences")}
      </div>
    );

    if (tab === "Integrations") {
      const integrations = [
        { name: "Slack",      desc: "Send alerts and notifications to Slack channels",   icon: "💬", connected: true  },
        { name: "GitHub",     desc: "Link deployments to repository commits",             icon: "🐙", connected: false },
        { name: "Datadog",    desc: "Forward metrics and logs to Datadog",                icon: "📊", connected: true  },
        { name: "PagerDuty",  desc: "Trigger on-call alerts for critical failures",       icon: "🚨", connected: false },
        { name: "Stripe",     desc: "Sync billing events with Stripe webhooks",           icon: "💳", connected: true  },
      ];
      return (
        <div className="space-y-3">
          {integrations.map((intg) => (
            <div
              key={intg.name}
              className="flex items-center gap-5 bg-surface2 border border-border rounded-2xl p-6 transition-all hover:border-orange-border"
            >
              <div className="text-3xl">{intg.icon}</div>
              <div className="flex-1">
                <div className="font-sans font-medium text-ink">{intg.name}</div>
                <div className="text-sm text-ink-muted mt-1 font-sans">{intg.desc}</div>
              </div>
              {intg.connected ? (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-4 py-1 bg-green-dim text-green border border-green-border rounded-full">
                    Connected
                  </span>
                  <button className="px-5 py-2 text-[10px] font-mono uppercase tracking-wider border border-border hover:border-orange hover:text-orange rounded-xl transition-all">
                    Disconnect
                  </button>
                </div>
              ) : (
                <button className="px-6 py-2 text-[10px] font-mono uppercase tracking-wider border border-orange-border text-orange hover:bg-orange-dim rounded-xl transition-all">
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (tab === "Danger Zone") return (
      <div className="space-y-4">
        {[
          { title: "Reset All Settings",   desc: "Revert all configuration to factory defaults. This cannot be undone.",               btnLabel: "Reset",  fill: false },
          { title: "Revoke All API Keys",   desc: "Immediately invalidate all active API tokens. All integrations will break.",         btnLabel: "Revoke", fill: false },
          { title: "Delete Organization",   desc: "Permanently delete this organization and all associated data. Irreversible.",        btnLabel: "Delete", fill: true  },
        ].map((item) => (
          <div key={item.title} className="bg-red-dim border border-red rounded-2xl p-6 flex justify-between items-center">
            <div>
              <div className="font-sans font-bold text-red">{item.title}</div>
              <div className="text-sm text-ink-muted mt-2 font-sans">{item.desc}</div>
            </div>
            <button
              className={`px-7 py-2.5 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all active:scale-95 ${
                item.fill ? "bg-red text-white hover:opacity-90" : "border border-red text-red hover:bg-red-dim"
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

  return (
    <div className="text-ink">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tighter text-ink">Settings</h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="h-px w-7 bg-green rounded-full" />
          <p className="text-ink-muted text-sm font-sans font-light">
            Configure application preferences and system behavior
          </p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Tab Bar */}
        <div className="flex border-b border-border bg-surface2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-xs font-mono uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "text-orange border-orange"
                  : "text-ink-muted border-transparent hover:text-ink-soft"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-8">
          <TabContent tab={activeTab} />
        </div>
      </div>
    </div>
  );
}