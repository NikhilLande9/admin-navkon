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
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        background: on ? "var(--orange)" : "var(--border)",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
        border: `1px solid ${on ? "var(--orange)" : "var(--border)"}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: on ? 20 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: on ? "#fff" : "var(--ink-dim)",
          transition: "left 0.2s",
          boxShadow: on ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
        }}
      />
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 0",
        borderBottom: "1px solid var(--border2)",
      }}
    >
      <div>
        <div style={{ fontSize: 13, color: "var(--ink)" }}>{label}</div>
        {desc && (
          <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 3, maxWidth: 420 }}>
            {desc}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, marginLeft: 24 }}>{children}</div>
    </div>
  );
}

function FieldInput({ placeholder, defaultValue, type = "text" }: {
  placeholder?: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        color: "var(--ink)",
        padding: "8px 14px",
        borderRadius: 6,
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
        outline: "none",
        width: 240,
        transition: "border-color 0.2s",
      }}
      onFocus={(e) => (e.target.style.borderColor = "var(--orange)")}
      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
    />
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabName>("General");
  const [, setThemeKey] = useState(0); // Force re-render when theme changes

  const selectStyle: React.CSSProperties = {
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    color: "var(--ink)",
    padding: "8px 14px",
    borderRadius: 6,
    fontFamily: "inherit",
    fontSize: 12,
    outline: "none",
    minWidth: 180,
  };

  const saveButton = (label: string) => (
    <div style={{ marginTop: 32 }}>
      <button
        style={{
          background: "var(--orange)",
          border: "none",
          color: "#fff",
          padding: "10px 28px",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 12,
          fontFamily: "inherit",
          fontWeight: 500,
          transition: "opacity 0.15s",
        }}
        onMouseOver={(e) => ((e.target as HTMLButtonElement).style.opacity = "0.85")}
        onMouseOut={(e) => ((e.target as HTMLButtonElement).style.opacity = "1")}
      >
        {label}
      </button>
    </div>
  );

  const TabContent = ({ tab }: { tab: TabName }) => {
    if (tab === "General") {
      return (
        <div>
          <SettingRow label="Organization Name" desc="Displayed in the admin panel and email footers.">
            <FieldInput defaultValue="Navkon" />
          </SettingRow>
          <SettingRow label="Admin Email" desc="Used for system notifications and account recovery.">
            <FieldInput defaultValue="admin@navkon.io" type="email" />
          </SettingRow>
          <SettingRow label="Timezone" desc="Affects all timestamp displays and scheduled tasks.">
            <select style={selectStyle}>
              <option>Asia/Kolkata (IST)</option>
              <option>America/New_York (EST)</option>
              <option>Europe/London (GMT)</option>
              <option>UTC</option>
            </select>
          </SettingRow>
          <SettingRow label="Language">
            <FieldInput defaultValue="English (US)" />
          </SettingRow>
          <SettingRow label="Dark Mode" desc="Toggle between light and dark interface themes. Changes apply immediately.">
            <Toggle
              defaultOn={typeof window !== "undefined" ? localStorage.getItem("navkon_theme") !== "light" : true}
              onChange={(isDark) => {
                localStorage.setItem("navkon_theme", isDark ? "dark" : "light");
                // Trigger theme update
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
    }

    if (tab === "Security") {
      return (
        <div>
          <SettingRow label="Two-Factor Authentication" desc="Require 2FA for all admin accounts.">
            <Toggle defaultOn />
          </SettingRow>
          <SettingRow label="Session Timeout" desc="Automatically log out after inactivity period.">
            <select style={selectStyle}>
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>4 hours</option>
              <option>Never</option>
            </select>
          </SettingRow>
          <SettingRow label="API Key" desc="Use this key to authenticate with the Navkon API.">
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="password"
                defaultValue="sk-navkon-xxxxxxxxxxx"
                style={{ ...selectStyle, width: 220, color: "var(--ink-muted)" }}
              />
              <button style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--ink-muted)",
                padding: "8px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 11,
              }}>
                Reveal
              </button>
              <button style={{
                background: "transparent",
                border: "1px solid var(--red-dim)",
                color: "var(--red)",
                padding: "8px 14px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 11,
              }}>
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
    }

    if (tab === "Notifications") {
      return (
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
    }

    if (tab === "Integrations") {
      const integrations = [
        { name: "Slack", desc: "Send alerts and notifications to Slack channels", icon: "💬", connected: true },
        { name: "GitHub", desc: "Link deployments to repository commits", icon: "🐙", connected: false },
        { name: "Datadog", desc: "Forward metrics and logs to Datadog", icon: "📊", connected: true },
        { name: "PagerDuty", desc: "Trigger on-call alerts for critical failures", icon: "🚨", connected: false },
        { name: "Stripe", desc: "Sync billing events with Stripe webhooks", icon: "💳", connected: true },
      ];

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {integrations.map((intg) => (
            <div
              key={intg.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: 24 }}>{intg.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{intg.name}</div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>{intg.desc}</div>
              </div>
              {intg.connected ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{
                    fontSize: 11,
                    color: "var(--green)",
                    background: "var(--green-dim)",
                    padding: "3px 10px",
                    borderRadius: 20,
                    border: "1px solid var(--green-border)",
                  }}>
                    Connected
                  </span>
                  <button style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--ink-muted)",
                    padding: "6px 14px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 11,
                  }}>
                    Disconnect
                  </button>
                </div>
              ) : (
                <button style={{
                  background: "transparent",
                  border: "1px solid var(--orange-border)",
                  color: "var(--orange)",
                  padding: "6px 16px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 11,
                }}>
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (tab === "Danger Zone") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            {
              title: "Reset All Settings",
              desc: "Revert all configuration to factory defaults. This cannot be undone.",
              btnLabel: "Reset",
              fill: false,
            },
            {
              title: "Revoke All API Keys",
              desc: "Immediately invalidate all active API tokens. All integrations will break.",
              btnLabel: "Revoke",
              fill: false,
            },
            {
              title: "Delete Organization",
              desc: "Permanently delete this organization and all associated data. Irreversible.",
              btnLabel: "Delete",
              fill: true,
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "var(--red-dim)",
                border: "1px solid var(--red)",
                borderRadius: 10,
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: "var(--red)", fontWeight: 500 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>{item.desc}</div>
              </div>
              <button
                style={{
                  background: item.fill ? "var(--red)" : "transparent",
                  border: `1px solid var(--red)`,
                  color: item.fill ? "#fff" : "var(--red)",
                  padding: "9px 20px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "inherit",
                  fontWeight: item.fill ? 500 : 400,
                }}
              >
                {item.btnLabel}
              </button>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace", color: "var(--ink)" }}>
      <style>{`
        .tab-btn {
          background: transparent;
          border: none;
          color: var(--ink-muted);
          padding: 12px 20px;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          border-bottom: 3px solid transparent;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .tab-btn:hover { color: var(--ink-soft); }
        .tab-btn.active {
          color: var(--orange);
          border-bottom-color: var(--orange);
        }
      `}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.5px",
          margin: 0,
          color: "var(--ink)"
        }}>
          Settings
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <div style={{ height: 2, width: 28, background: "var(--green)", borderRadius: 1 }} />
          <p style={{ color: "var(--ink-muted)", fontSize: 13, margin: 0, fontWeight: 300 }}>
            Configure application preferences and system behavior
          </p>
        </div>
      </div>

      <div style={{
        background: "var(--grad-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden"
      }}>
        {/* Tab Bar */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          padding: "0 8px",
          overflowX: "auto",
          background: "var(--surface2)"
        }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div style={{ padding: 28 }}>
          <TabContent tab={activeTab} />
        </div>
      </div>
    </div>
  );
}