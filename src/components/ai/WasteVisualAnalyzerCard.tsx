"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { AiDisclaimer } from "@/components/ai/AiDisclaimer";
import { aiService, wasteBatchService } from "@/data/services";
import { AiWasteVisualAnalysis } from "@/data/contracts/ai";
import { WasteBatchListItem } from "@/data/contracts/waste-batch";
import { wasteImageUploadSchema } from "@/lib/validators/ai";

const DEMO_PRESETS = [
  {
    id: "peel_clean",
    name: "Fresh Mango Peel (Intake Sample A)",
    scenario: "peel_clean",
    description: "Yellow-orange peel tissue with minimal localized surface spots.",
  },
  {
    id: "peel_discolored",
    name: "Oxidized Mango Peel (Intake Sample B)",
    scenario: "peel_discolored",
    description: "Peel with noticeable browning spots and tissue softening.",
  },
  {
    id: "seed_clean",
    name: "Mango Seed Kernel (Husk Sample C)",
    scenario: "seed_clean",
    description: "Dry fibrous mango endocarp husk ready for milling.",
  },
];

export const WasteVisualAnalyzerCard: React.FC = () => {
  const [wasteBatches, setWasteBatches] = useState<WasteBatchListItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>("peel_clean");
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AiWasteVisualAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await wasteBatchService.getWasteBatches({ pageSize: 50 });
        setWasteBatches(res.items);
      } catch {
        // non-blocking
      }
    }
    loadBatches();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = wasteImageUploadSchema.safeParse({
      fileSize: file.size,
      mimeType: file.type,
    });

    if (!validation.success) {
      setError(validation.error.errors[0]?.message || "Invalid image file.");
      return;
    }

    setCustomFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const SAMPLE_PRESET_BASE64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const isCustom = Boolean(customFile);
      let dataUrl = "";
      if (isCustom && customFile) {
        dataUrl = await fileToBase64(customFile);
      } else {
        dataUrl = SAMPLE_PRESET_BASE64;
      }

      const res = await aiService.analyzeWasteImage({
        imageName: isCustom ? customFile!.name : `${selectedPreset}.png`,
        imageSize: isCustom ? customFile!.size : 256,
        imageMime: isCustom ? customFile!.type : "image/png",
        imageDataUrl: dataUrl,
        wasteBatchId: selectedBatchId || null,
        demoScenario: !isCustom ? selectedPreset : undefined,
      });
      setAnalysisResult(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Visual assessment failed to execute."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setCustomFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <AiDisclaimer
        label="AI-Assisted Visual Assessment"
        description="This multimodal vision tool performs macroscopic surface assessment based solely on visible image features. It is not a substitute for formal moisture titration or laboratory assay testing."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Selection & Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <CardTitle className="text-base">Waste Image Input</CardTitle>
              </div>
              <CardDescription>
                Upload an intake photograph or select a calibrated prototype sample.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              {/* Preset Scenario Selector */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-text-primary">
                  Select Calibrated Demo Sample
                </label>
                <div className="space-y-2">
                  {DEMO_PRESETS.map((p) => (
                    <label
                      key={p.id}
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-colors ${
                        !customFile && selectedPreset === p.id
                          ? "border-purple-500 bg-purple-500/5 text-text-primary"
                          : "border-border bg-surface hover:bg-surface-secondary/40 text-text-secondary"
                      }`}
                      onClick={() => {
                        setCustomFile(null);
                        setPreviewUrl(null);
                        setSelectedPreset(p.id);
                      }}
                    >
                      <input
                        type="radio"
                        name="demo_preset"
                        checked={!customFile && selectedPreset === p.id}
                        onChange={() => {}}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-text-primary block text-[11px]">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-text-secondary line-clamp-1">
                          {p.description}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Upload Dropzone */}
              <div className="pt-2">
                <label className="block font-semibold text-text-primary mb-1.5">
                  Or Upload Custom Image (JPEG, PNG, WebP ≤ 5 MB)
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:bg-surface-secondary/30 transition-colors">
                  {previewUrl ? (
                    <div className="mb-2 flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Upload preview"
                        className="max-h-32 rounded-lg object-contain border border-border"
                      />
                    </div>
                  ) : (
                    <Upload className="w-6 h-6 text-text-secondary mx-auto mb-1.5" />
                  )}
                  <p className="text-[11px] font-semibold text-text-primary">
                    {customFile ? customFile.name : "Click to browse or drop photo"}
                  </p>
                  <p className="text-[10px] text-text-secondary mt-0.5">
                    Max 5 MB
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    id="analyzer-file-input"
                  />
                  <label
                    htmlFor="analyzer-file-input"
                    className="inline-flex items-center gap-1 px-2.5 py-1 mt-2 text-[11px] font-semibold rounded-lg border border-border bg-surface hover:bg-surface-secondary text-text-primary cursor-pointer transition-colors"
                  >
                    Select Photo
                  </label>
                </div>
              </div>

              {/* Optional Batch Linker */}
              <div className="space-y-1.5 pt-2">
                <label
                  htmlFor="link_batch_select"
                  className="block font-semibold text-text-primary flex items-center gap-1"
                >
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span>Associate Waste Batch (Optional)</span>
                </label>
                <select
                  id="link_batch_select"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-text-primary focus:outline-none focus:border-primary font-mono"
                >
                  <option value="">-- No batch associated --</option>
                  {wasteBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchCode} ({b.wasteType}, {b.currentStatus})
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg border border-danger/40 bg-danger/10 text-[11px] text-danger flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  isLoading={isAnalyzing}
                  onClick={handleRunAnalysis}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  Run Visual Assessment
                </Button>

                {(customFile || analysisResult) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    disabled={isAnalyzing}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Structured AI Assessment Output (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className={analysisResult ? "border-purple-500/40" : ""}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-base">Structured Visual Output</CardTitle>
                </div>
                <CardDescription>
                  Structured schema response from prototype vision assessment.
                </CardDescription>
              </div>
              {analysisResult && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  AI Analyzed
                </span>
              )}
            </CardHeader>

            <CardContent className="space-y-4 text-xs">
              {!analysisResult && !isAnalyzing && (
                <div className="p-8 text-center text-text-secondary space-y-2">
                  <Eye className="w-8 h-8 mx-auto text-text-secondary/60" />
                  <p className="font-semibold text-text-primary text-xs">
                    No visual assessment generated yet
                  </p>
                  <p className="text-[11px] max-w-xs mx-auto">
                    Select a calibrated sample or upload an image and click &quot;Run Visual Assessment&quot; to inspect surface findings.
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="p-8 text-center text-text-secondary space-y-3">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-semibold text-text-primary text-xs">
                    Analyzing macroscopic image features...
                  </p>
                  <p className="text-[10px] text-text-secondary">
                    Evaluating visible pigmentation, surface irregularities, and degradation patterns.
                  </p>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-4">
                  {/* Visual Assessment Highlights */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-lg border border-border bg-surface-secondary/30 space-y-0.5">
                      <span className="text-[10px] text-text-secondary font-medium block">
                        Likely Type
                      </span>
                      <span className="font-bold text-text-primary truncate block">
                        {analysisResult.wasteTypeLabel}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border bg-surface-secondary/30 space-y-0.5">
                      <span className="text-[10px] text-text-secondary font-medium block">
                        Visual Condition
                      </span>
                      <span
                        className={`font-bold capitalize block ${
                          analysisResult.visualCondition === "good"
                            ? "text-emerald-600"
                            : analysisResult.visualCondition === "poor"
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}
                      >
                        {analysisResult.visualCondition}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border bg-surface-secondary/30 space-y-0.5">
                      <span className="text-[10px] text-text-secondary font-medium block">
                        Discoloration
                      </span>
                      <span className="font-bold capitalize text-text-primary block">
                        {analysisResult.visibleDiscoloration}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-border bg-surface-secondary/30 space-y-0.5">
                      <span className="text-[10px] text-text-secondary font-medium block">
                        Irregularities
                      </span>
                      <span className="font-bold capitalize text-text-primary block">
                        {analysisResult.visibleSurfaceIrregularities}
                      </span>
                    </div>
                  </div>

                  {/* Observable Surface Findings */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-text-primary block">
                      Visible Macroscopic Findings:
                    </span>
                    <ul className="space-y-1.5 p-3 rounded-xl border border-border bg-surface">
                      {analysisResult.visibleFindings.map((finding, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-text-primary text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Manual Review Recommendation Alert */}
                  {analysisResult.manualReviewRecommended ? (
                    <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 flex items-start gap-2.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[11px]">
                          Manual Operator Review Recommended
                        </p>
                        <p className="text-[10px] leading-relaxed mt-0.5">
                          Visual indicators suggest non-uniform discoloration or elevated moisture. Operator inspection should verify sorting before advancing to washing.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[11px]">
                          Visual Appearance Within Standard Parameters
                        </p>
                        <p className="text-[10px] leading-relaxed mt-0.5">
                          No macroscopic anomalies or severe degradation detected on visible surfaces.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Scientific Limitation & Confidence Note */}
                  <div className="p-3 rounded-lg border border-border/80 bg-surface-secondary/20 text-[10px] text-text-secondary leading-relaxed font-mono">
                    <strong>Confidence Note:</strong> {analysisResult.confidenceNote}
                  </div>

                  {/* Audit Metadata */}
                  <div className="flex items-center justify-between text-[10px] text-text-secondary pt-2 border-t border-border/60">
                    <span>Model: <strong className="font-mono text-text-primary">{analysisResult.model}</strong></span>
                    <span>Audit ID: <strong className="font-mono">{analysisResult.analyzedAt.split("T")[0]}</strong></span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
