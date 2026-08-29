"use client";

import React, { useState, useEffect } from "react";
import {
  ScrollText,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { AuditLogEntry } from "@/data/contracts/admin";
import { adminService } from "@/data/services";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getAuditLogs({
        search: search.trim() || undefined,
        action: actionFilter !== "all" ? actionFilter : undefined,
        entityType: entityFilter !== "all" ? entityFilter : undefined,
      });
      setLogs(res.items);
    } finally {
      setIsLoading(false);
    }
  }, [search, actionFilter, entityFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-primary" />
          <span>Platform Audit Activity</span>
        </h1>
        <p className="text-xs text-text-secondary">
          Recorded log of simulated and prototype operational actions per 27-AUDIT-LOGGING.md
        </p>
      </div>

      <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-text-secondary flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-text-primary block font-semibold">
            Prototype Audit Activity Stream
          </strong>
          <p className="text-[11px] leading-relaxed">
            The prototype UI exposes no edit or delete controls for recorded audit activity. User creation, role promotions, deactivations, batch status transitions, and system settings modifications are captured with actor IDs and structured before/after JSON state snapshots. Full database persistence and cryptographic immutability are deferred to backend engineering.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="relative">
              <input
                type="text"
                placeholder="Search audit actions or actors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full ps-9 pe-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Search className="w-4 h-4 text-text-secondary absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full ps-9 pe-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Action Types</option>
                <option value="user.created">user.created</option>
                <option value="user.role_changed">user.role_changed</option>
                <option value="user.deactivated">user.deactivated</option>
                <option value="batch.created">batch.created</option>
                <option value="batch.stage_changed">batch.stage_changed</option>
                <option value="product.created">product.created</option>
                <option value="settings.updated">settings.updated</option>
              </select>
              <Filter className="w-4 h-4 text-text-secondary absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full ps-9 pe-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Entity Types</option>
                <option value="profile">profile (Users)</option>
                <option value="waste_batch">waste_batch</option>
                <option value="product_batch">product_batch</option>
                <option value="laboratory_test">laboratory_test</option>
                <option value="app_settings">app_settings</option>
              </select>
              <Filter className="w-4 h-4 text-text-secondary absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Audit Log Events</CardTitle>
          <CardDescription>
            Displaying {logs.length} logged platform event(s)
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-y border-border bg-surface-secondary/50 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4 w-8"></th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-secondary">
                      Loading audit events...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-secondary">
                      No audit records found matching query.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const hasStateDiff = log.beforeValue || log.afterValue;

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          onClick={() => hasStateDiff && toggleExpand(log.id)}
                          className={`hover:bg-surface-secondary/50 transition-colors ${
                            hasStateDiff ? "cursor-pointer" : ""
                          } ${isExpanded ? "bg-surface-secondary/40" : ""}`}
                        >
                          <td className="py-3 px-3 text-center text-text-secondary">
                            {hasStateDiff ? (
                              isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )
                            ) : null}
                          </td>

                          {/* Timestamp */}
                          <td className="py-3 px-4 whitespace-nowrap text-text-secondary">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-text-secondary/70" />
                              <span>{log.createdAt.replace("T", " ").replace("Z", "").slice(0, 19)}</span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                              {log.action}
                            </span>
                          </td>

                          {/* Actor */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-[10px] font-bold text-text-secondary">
                                <User className="w-3 h-3" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-text-primary block truncate max-w-[150px]">
                                  {log.actorName || log.actorId}
                                </span>
                                {log.actorRole && (
                                  <span className="text-[10px] text-text-secondary capitalize block">
                                    {log.actorRole.replace("_", " ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Entity */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-text-secondary" />
                              <span className="font-mono text-text-primary">{log.entityType}</span>
                              {log.entityId && (
                                <span className="text-[10px] text-text-secondary">({log.entityId})</span>
                              )}
                            </div>
                          </td>

                          {/* IP */}
                          <td className="py-3 px-4 whitespace-nowrap text-text-secondary font-mono text-[11px]">
                            {log.ipAddress || "127.0.0.1"}
                          </td>
                        </tr>

                        {/* State diff expandable row */}
                        {isExpanded && hasStateDiff && (
                          <tr className="bg-surface-secondary/20 border-b border-border">
                            <td colSpan={6} className="p-4 ps-11">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {log.beforeValue && (
                                  <div className="p-3 rounded-lg border border-border bg-surface space-y-1">
                                    <span className="font-bold text-[11px] text-text-secondary uppercase">
                                      Before State
                                    </span>
                                    <pre className="text-[11px] font-mono p-2 rounded bg-surface-secondary overflow-x-auto text-text-primary">
                                      {JSON.stringify(log.beforeValue, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.afterValue && (
                                  <div className="p-3 rounded-lg border border-primary/20 bg-surface space-y-1">
                                    <span className="font-bold text-[11px] text-primary uppercase">
                                      After State
                                    </span>
                                    <pre className="text-[11px] font-mono p-2 rounded bg-surface-secondary overflow-x-auto text-text-primary">
                                      {JSON.stringify(log.afterValue, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
