"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import RoleGuard from "@/components/auth/RoleGuard";
import { 
  History, Search, Loader2, User, 
  Clock 
} from "lucide-react";

type AuditEntry = {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: { seconds: number } | null;
  details: string;
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "audit_logs"), 
      orderBy("timestamp", "desc"), 
      limit(100)
    );

    return onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as AuditEntry)));
      setLoading(false);
    });
  }, []);

  const filtered = logs.filter(l => 
    [l.action, l.user, l.target].some(v => 
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <RoleGuard page="Support">
      <div className="font-mono text-ink p-4">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <History size={24} className="text-orange" strokeWidth={1.75} />
            <h1 className="font-serif text-3xl font-bold tracking-tighter">Audit Log</h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-px w-8 bg-orange rounded" />
            <p className="text-ink-muted text-sm font-light">System activity trail</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-sans text-ink placeholder:text-ink-ghost focus:border-orange outline-none transition-colors" 
          />
        </div>

        {/* Table */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-ink-muted text-sm">
              <Loader2 size={18} className="animate-spin text-orange" /> Loading...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface2 border-b border-border text-[10px] uppercase tracking-widest text-ink-dim font-bold">
                    <th className="px-6 py-3 font-mono">Time</th>
                    <th className="px-6 py-3 font-mono">User</th>
                    <th className="px-6 py-3 font-mono">Action</th>
                    <th className="px-6 py-3 font-mono text-right">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-sans text-xs">
                  {filtered.map((log) => (
                    <tr key={log.id} className="hover:bg-surface2/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-ink-muted font-mono text-[11px]">
                        {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleString() : '---'}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <User size={12} className="text-blue" />
                        <span className="text-ink font-medium">{log.user}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-orange-dim text-orange border border-orange-border text-[10px] font-mono uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-ink-muted italic">
                        {log.target}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}