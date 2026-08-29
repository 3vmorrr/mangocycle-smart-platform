"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  QrCode,
  Search,
  Camera,
  CameraOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Leaf,
  FlaskConical,
  ExternalLink,
} from "lucide-react";
import { PublicHeader } from "@/components/traceability/PublicHeader";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { validateAndResolveQrPayload } from "@/lib/trace/qr-validator";

export default function GenericPublicTracePage() {
  const router = useRouter();

  // Manual lookup state
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  // Scanner state
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<
    "idle" | "starting" | "scanning" | "denied" | "unsupported" | "error"
  >("idle");
  const [scanError, setScanError] = useState<string | null>(null);

  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const scannerContainerId = "html5-qr-reader";

  // Stop scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setScanError(null);
    setScannerStatus("starting");
    setIsScannerActive(true);

    try {
      // Dynamic import to ensure client-only loading
      const { Html5Qrcode } = await import("html5-qrcode");

      if (!Html5Qrcode) {
        setScannerStatus("unsupported");
        setScanError("Camera scanner is not supported on this browser.");
        return;
      }

      // If scanner instance already exists, stop it first
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore
        }
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      const qrCodeSuccessCallback = (decodedText: string) => {
        const resolution = validateAndResolveQrPayload(
          decodedText,
          process.env.NEXT_PUBLIC_APP_URL
        );

        if (resolution.isValid && resolution.targetRoute) {
          stopScanner();
          router.push(resolution.targetRoute);
        } else {
          setScanError(resolution.error || "Scanned code is not a valid MangoCycle record.");
        }
      };

      const qrCodeErrorCallback = () => {
        // Continuous scan loop frame misses - ignore to avoid noisy UI
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      );

      setScannerStatus("scanning");
    } catch (err: unknown) {
      console.warn("QR Scanner initialization error:", err);
      const errMsg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (errMsg.includes("notallowederror") || errMsg.includes("permission denied")) {
        setScannerStatus("denied");
        setScanError("Camera permission was denied. Please allow camera access in browser settings.");
      } else if (errMsg.includes("notfounderror") || errMsg.includes("no camera")) {
        setScannerStatus("unsupported");
        setScanError("No compatible camera found on this device.");
      } else {
        setScannerStatus("error");
        setScanError("Failed to initialize camera scanner. Please use manual code lookup.");
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setIsScannerActive(false);
    setScannerStatus("idle");
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const normalized = manualCode.trim().toUpperCase();
    if (!normalized) {
      setManualError("Please enter a batch identifier.");
      return;
    }

    if (normalized.startsWith("MW-")) {
      if (!/^[A-Z0-9-]+$/.test(normalized)) {
        setManualError("Invalid waste batch identifier format.");
        return;
      }
      router.push(`/trace/waste/${normalized}`);
      return;
    }

    if (normalized.startsWith("BF-")) {
      if (!/^[A-Z0-9-]+$/.test(normalized)) {
        setManualError("Invalid product batch identifier format.");
        return;
      }
      router.push(`/trace/product/${normalized}`);
      return;
    }

    setManualError(
      "Unrecognized code prefix. Waste batches start with 'MW-' and Products start with 'BF-'."
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg selection:bg-primary/20 text-text-primary">
      {/* 1. Public Header */}
      <PublicHeader />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Title Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Digital Traceability Verification</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
            Public QR Traceability
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
            Scan a physical container QR code or enter a Batch Identifier to verify organic origin and processing milestones.
          </p>
        </div>

        {/* 2. QR Camera Scanner Card */}
        <Card className="border-t-4 border-t-primary shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" />
                <CardTitle className="text-base sm:text-lg">Camera QR Scanner</CardTitle>
              </div>
              {isScannerActive && (
                <Button variant="outline" size="sm" onClick={stopScanner} leftIcon={<CameraOff className="w-3.5 h-3.5" />}>
                  Stop Camera
                </Button>
              )}
            </div>
            <CardDescription>
              Point your camera at a MangoCycle QR code label on waste containers or biological product packaging.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-1">
            {/* Viewfinder Area */}
            <div className="relative rounded-xl border border-border bg-surface-secondary/50 overflow-hidden flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px]">
              {/* HTML5 QR Container */}
              <div
                id={scannerContainerId}
                className={`w-full max-w-md ${isScannerActive ? "block" : "hidden"}`}
              />

              {isScannerActive && scannerStatus === "starting" && (
                <div className="p-6 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                  <p className="text-xs text-text-secondary">Initializing camera scanner...</p>
                </div>
              )}

              {!isScannerActive && (
                <div className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-semibold text-text-primary">
                      Camera scanner is currently inactive
                    </p>
                    <p className="text-[11px] text-text-secondary max-w-xs mx-auto">
                      Camera access will only be requested when you click the button below.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={startScanner}
                    leftIcon={<Camera className="w-4 h-4" />}
                  >
                    Start Camera Scanner
                  </Button>
                </div>
              )}

              {/* Status and Error Banners */}
              {scanError && (
                <div className="m-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2 max-w-md">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Scan Error</span>
                    <span>{scanError}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 3. Manual Batch Code Lookup Card */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">Manual Batch Lookup</CardTitle>
            </div>
            <CardDescription>
              If scanning is unavailable, enter the human-readable batch code printed on the physical label.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => {
                      setManualCode(e.target.value);
                      if (manualError) setManualError(null);
                    }}
                    placeholder="e.g. MW-2026-001 or BF-2026-001"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text-primary text-sm font-mono placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Verify Record
                </Button>
              </div>

              {manualError && (
                <p className="text-xs text-danger flex items-center gap-1.5 pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{manualError}</span>
                </p>
              )}
            </form>

            {/* Quick Demonstration Shortcuts */}
            <div className="pt-3 border-t border-border/60">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-2">
                Sample Demonstrations
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link
                  href="/trace/waste/MW-2026-001"
                  className="p-2.5 rounded-lg border border-border bg-surface hover:bg-surface-secondary/50 transition-colors flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-2">
                    <Leaf className="w-3.5 h-3.5 text-primary" />
                    <div>
                      <span className="font-mono font-bold text-text-primary block">MW-2026-001</span>
                      <span className="text-[11px] text-text-secondary">Mango Peel Waste Batch</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-text-secondary group-hover:text-primary transition-colors" />
                </Link>

                <Link
                  href="/trace/product/BF-2026-001"
                  className="p-2.5 rounded-lg border border-border bg-surface hover:bg-surface-secondary/50 transition-colors flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                    <div>
                      <span className="font-mono font-bold text-text-primary block">BF-2026-001</span>
                      <span className="text-[11px] text-text-secondary">Biofungicide Formulation</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-text-secondary group-hover:text-purple-600 transition-colors" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
