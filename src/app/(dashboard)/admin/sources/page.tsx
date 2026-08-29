"use client";

import React, { useState, useEffect } from "react";
import { Building2, MapPin, Phone, Sparkles } from "lucide-react";
import { WasteSource } from "@/data/contracts/waste-batch";
import { wasteBatchService } from "@/data/services";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<WasteSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    wasteBatchService.getWasteSources().then((res) => {
      setSources(res);
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span>Waste Sources Registry</span>
          </h1>
          <p className="text-xs text-text-secondary">
            Manage origin farms, university experimental orchards, and industrial food processing suppliers
          </p>
        </div>
      </div>

      <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-text-secondary flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-text-primary block font-semibold">
            Configurable Source Registry (05-DATABASE-SCHEMA.md §3.2)
          </strong>
          <p className="text-[11px] leading-relaxed">
            Waste sources map intake lots to verified agricultural and commercial origins. Public traceability anonymizes or exposes friendly supplier names according to governance privacy policy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-text-secondary">
            Loading waste sources registry...
          </div>
        ) : (
          sources.map((source) => (
            <Card key={source.id} className="border-border/80 hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {(source.sourceType || "source").replace(/_/g, " ")}
                  </span>
                  {source.isActive ? (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-text-secondary">Inactive</span>
                  )}
                </div>
                <CardTitle className="text-sm font-bold text-text-primary">{source.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-text-secondary pt-0">
                {source.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-text-secondary shrink-0 mt-0.5" />
                    <span>{source.location}</span>
                  </div>
                )}
                {source.contactInfo && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                    <span>{source.contactInfo}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
