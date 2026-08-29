import React from "react";
import Link from "next/link";
import { ArrowRight, QrCode, ShieldCheck, Leaf, FlaskConical } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg selection:bg-primary/20">
      {/* Top Navigation */}
      <header className="border-b border-border/80 bg-surface/80 backdrop-blur-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-lg shadow-xs">
              🥭
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-text-primary tracking-tight">
                MangoCycle
              </span>
              <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
                Smart Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/trace">
              <Button variant="outline" size="sm" leftIcon={<QrCode className="w-3.5 h-3.5" />}>
                Public QR Trace
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Enter Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary-dark text-xs font-semibold mx-auto mb-6 dark:bg-primary-dark/30 dark:text-primary-light border border-primary/20">
          <Leaf className="w-3.5 h-3.5" />
          <span>Biotechnology Waste Valorization & Traceability</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-text-primary text-balance mb-6">
          Transforming Mango Waste into <br className="hidden sm:inline" />
          <span className="text-primary">High-Value Biological Products</span>
        </h1>

        <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto text-balance mb-10">
          An integrated operational platform enabling end-to-end traceability, laboratory verification, and AI-assisted decision support for circular biotechnology innovation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open Operational Dashboard
            </Button>
          </Link>
          <Link href="/trace/waste/MW-2026-001" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-base" leftIcon={<QrCode className="w-4 h-4" />}>
              View Sample Public Trace
            </Button>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-start">
          <Card variant="flat">
            <CardHeader>
              <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 flex items-center justify-center mb-2">
                <QrCode className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm">End-to-End Traceability</CardTitle>
              <CardDescription>
                Track mango peels and seeds from source intake through grinding and formulation to final batch.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card variant="flat">
            <CardHeader>
              <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 flex items-center justify-center mb-2">
                <FlaskConical className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm">Laboratory Validation</CardTitle>
              <CardDescription>
                Record spectroscopy, TEM morphology, and antimicrobial assay results with linked test records.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card variant="flat">
            <CardHeader>
              <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm">AI Decision Support</CardTitle>
              <CardDescription>
                AI-assisted visual assessment and scientific rule-based processing recommendations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card variant="flat">
            <CardHeader>
              <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center justify-center mb-2">
                <Leaf className="w-4 h-4" />
              </div>
              <CardTitle className="text-sm">Verified Sustainability</CardTitle>
              <CardDescription>
                Deterministic metrics measuring waste diverted from disposal and processing efficiency.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 text-center text-xs text-text-secondary">
        <p>MangoCycle Smart Platform — Academic Biotechnology Innovation Project</p>
      </footer>
    </div>
  );
}
