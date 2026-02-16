import React from 'react';
import { ArrowRight, CheckCircle2, Shield, Database, Globe, BarChart3, Zap, GitBranch } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface HeroProps {
  setIsHome: (val: boolean) => void;
}

export const Hero: React.FC<HeroProps> = ({ setIsHome }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-600 rounded-lg opacity-20 rotate-45" />
            <div className="absolute inset-0.5 bg-blue-600 rounded-lg opacity-40 rotate-12" />
            <div className="relative z-10 bg-blue-600 w-full h-full rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight">
            Meraki<span className="text-blue-600">Migrate</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors">Features</a>
          <a href="#how" className="text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors">How it works</a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setIsHome(false)} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
            Sign in
          </Button>
          <Button onClick={() => setIsHome(false)} className="shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-105">
            Get started
          </Button>
        </div>
      </nav>

      {/* Hero body */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-16 items-center">

        {/* Left */}
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/50 border border-blue-200 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-6">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            Cisco Meraki Enterprise Platform
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight">
            Migrate, manage, and audit <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Meraki networks at scale.
            </span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
            A purpose-built operations platform for Cisco Meraki administrators.
            Cross-region migration, automated backup, configuration drift detection,
            and bulk operations — from one dashboard.
          </p>

          <div className="flex items-center gap-4 mb-12">
            <Button size="lg" onClick={() => setIsHome(false)} className="h-12 px-8 text-base shadow-xl shadow-blue-500/20 hover:scale-105 transition-all">
              Start migration <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setIsHome(false)} className="h-12 px-8 text-base bg-white/50 backdrop-blur-sm hover:bg-white/80 border-white/60">
              Request demo
            </Button>
          </div>

          {/* Stats row */}
          <div className="glass-card p-0 overflow-hidden flex divide-x divide-border/50 animate-float">
            {[
              { value: '99.9%', label: 'Migration success' },
              { value: '~10 min', label: 'Average time' },
              { value: '50+', label: 'Config categories' },
            ].map((s, i) => (
              <div key={s.label} className="flex-1 p-5 text-center bg-white/40 hover:bg-white/60 transition-colors">
                <div className="text-2xl font-bold text-foreground tracking-tight">
                  {s.value}
                </div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Platform capabilities card */}
        <div className="glass-card p-0 overflow-hidden shadow-2xl animate-fade-in-up delay-300 relative group" style={{ animationFillMode: 'both' }}>
          {/* Glow effect behind card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

          <div className="relative bg-white/80 backdrop-blur-xl h-full rounded-2xl">
            <div className="px-6 py-4 bg-muted/30 border-b border-border/50 flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Platform Capabilities
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold border border-green-200">
                v1.0 LIVE
              </span>
            </div>

            <div className="divide-y divide-border/40">
              {[
                { icon: <Globe size={16} className="text-blue-600" />, iconBg: 'bg-blue-50', title: 'Cross-region migration', desc: 'Global → India, China, Canada and more' },
                { icon: <Shield size={16} className="text-purple-600" />, iconBg: 'bg-purple-50', title: 'Pre-migration backup', desc: 'Full org snapshot saved as ZIP before any change' },
                { icon: <Database size={16} className="text-cyan-600" />, iconBg: 'bg-cyan-50', title: 'Configuration restore', desc: 'Auto-restores VLANs, firewall rules, SSIDs, RADIUS' },
                { icon: <BarChart3 size={16} className="text-amber-600" />, iconBg: 'bg-amber-50', title: 'Drift detection', desc: 'Compares live config against saved baseline' },
                { icon: <Zap size={16} className="text-indigo-600" />, iconBg: 'bg-indigo-50', title: 'Bulk operations', desc: 'Push changes across multiple networks at once' },
                { icon: <GitBranch size={16} className="text-red-600" />, iconBg: 'bg-red-50', title: 'Rollback on failure', desc: 'Smart stage-by-stage rollback if migration fails' },
              ].map((cap, i) => (
                <div key={cap.title} className="flex items-start gap-4 p-5 hover:bg-white/60 transition-colors cursor-default">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-black/5", cap.iconBg)}>
                    {cap.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{cap.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{cap.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
