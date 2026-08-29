"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Save, CheckCircle2, AlertCircle, Bot, ShieldCheck } from "lucide-react";
import { AiConfigurationState } from "@/data/contracts/admin";
import { adminService, authService } from "@/data/services";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { UserProfile } from "@/data/contracts/auth";
import { can } from "@/lib/permissions";

export const AiConfigForm: React.FC = () => {
  const [config, setConfig] = useState<AiConfigurationState | null>(null);
  const [currentActor, setCurrentActor] = useState<UserProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [aiData, actor] = await Promise.all([
        adminService.getAiConfiguration(),
        authService.getCurrentUser(),
      ]);
      setConfig(aiData);
      setCurrentActor(actor);
    } catch {
      setFormError("Failed to load AI configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setFormError(null);
    setSuccessMessage(null);
    setIsSaving(true);
    try {
      await adminService.updateAiConfiguration(config);
      setSuccessMessage("AI configuration saved successfully.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save AI configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasAccess = can(currentActor, "admin:configure_ai");

  if (isLoading || !config) {
    return <div className="p-8 text-center text-xs text-text-secondary">Loading AI configuration...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <Sliders className="w-5 h-5 text-primary" />
          <span>MangoCycle AI Configuration</span>
        </h1>
        <p className="text-xs text-text-secondary">
          Configure AI provider settings, inference parameters, and rate limit protections per 07-AUTH-AND-RBAC.md §4.8
        </p>
      </div>

      <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-text-secondary flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <strong className="text-text-primary block font-semibold">
            Server-Side Key Isolation (08-SECURITY.md §3)
          </strong>
          <p className="text-[11px] leading-relaxed">
            API keys are managed exclusively via server environment variables and are never rendered to the client browser.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {formError && (
        <div className="p-3.5 rounded-xl border border-danger/30 bg-danger/10 text-xs text-danger flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">Provider & Model Endpoints</CardTitle>
            </div>
            <CardDescription>
              Authoritative provider selection & rate limits (09-ROUTES-AND-PAGES.md §3.10). Detailed model endpoint mappings are prototype UI placeholders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 rounded-lg border border-border bg-surface-secondary/40 text-[11px] text-text-secondary">
              <strong>Documentation Contract:</strong> <code>09-ROUTES-AND-PAGES.md §3.10</code> specifies <em>&ldquo;AI provider settings, rate limits&rdquo;</em>. Specific model string overrides and temperature controls below are non-persistent prototype presentation controls pending final backend AI orchestration.
            </div>
            {/* Provider */}
            <div className="space-y-1">
              <label htmlFor="providerSelect" className="block font-semibold text-text-primary">
                Inference Provider
              </label>
              <select
                id="providerSelect"
                value={config.provider}
                onChange={(e) =>
                  setConfig({ ...config, provider: e.target.value as "openai" | "anthropic" | "mock" })
                }
                disabled={!hasAccess}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
              >
                <option value="mock">Simulated Prototype Provider (Deterministic Mock Data Adapter)</option>
                <option value="openai">OpenAI (Direct API)</option>
                <option value="anthropic">Anthropic Claude (Direct API)</option>
              </select>
            </div>

            {/* Model Waste Analyzer */}
            <div className="space-y-1">
              <label htmlFor="wasteAnalyzerModel" className="block font-semibold text-text-primary">
                AI Waste Visual Analyzer Model
              </label>
              <input
                id="wasteAnalyzerModel"
                type="text"
                value={config.modelWasteAnalyzer}
                onChange={(e) => setConfig({ ...config, modelWasteAnalyzer: e.target.value })}
                disabled={!hasAccess}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
              />
            </div>

            {/* Model Processing Advisor */}
            <div className="space-y-1">
              <label htmlFor="advisorModel" className="block font-semibold text-text-primary">
                AI Processing Advisor Model
              </label>
              <input
                id="advisorModel"
                type="text"
                value={config.modelProcessingAdvisor}
                onChange={(e) => setConfig({ ...config, modelProcessingAdvisor: e.target.value })}
                disabled={!hasAccess}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
              />
            </div>

            {/* Model Ask MangoCycle */}
            <div className="space-y-1">
              <label htmlFor="askModel" className="block font-semibold text-text-primary">
                Ask MangoCycle Assistant Model
              </label>
              <input
                id="askModel"
                type="text"
                value={config.modelAskMangoCycle}
                onChange={(e) => setConfig({ ...config, modelAskMangoCycle: e.target.value })}
                disabled={!hasAccess}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
              />
            </div>

            {/* Rate Limit and Temperature */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label htmlFor="rateLimit" className="block font-semibold text-text-primary">
                  Rate Limit (Requests / user / min)
                </label>
                <input
                  id="rateLimit"
                  type="number"
                  min={1}
                  max={60}
                  value={config.rateLimitUserPerMin}
                  onChange={(e) => setConfig({ ...config, rateLimitUserPerMin: parseInt(e.target.value, 10) || 10 })}
                  disabled={!hasAccess}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="temperature" className="block font-semibold text-text-primary">
                  Sampling Temperature ({config.temperature})
                </label>
                <input
                  id="temperature"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.temperature}
                  onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                  disabled={!hasAccess}
                  className="w-full h-2 bg-surface-secondary rounded-lg appearance-none cursor-pointer accent-primary mt-2 disabled:opacity-60"
                />
              </div>
            </div>
          </CardContent>
          {hasAccess && (
            <CardFooter className="pt-0 justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save AI Configuration
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
    </div>
  );
};
