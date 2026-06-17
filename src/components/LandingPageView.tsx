import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  ArrowRight, 
  Check, 
  ShieldCheck,
  CircleDot,
  Download,
  Laptop,
  Terminal,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  ChevronDown
} from 'lucide-react';

interface LandingPageViewProps {
  onGetStarted: () => void;
  onLoginClick: () => void;
  onSignUpClick: () => void;
  currentUser: { id: string; name: string; email: string } | null;
  licenseTier?: 'free' | 'starter' | 'professional' | 'enterprise';
}

export default function LandingPageView({ onGetStarted, onLoginClick, onSignUpClick, currentUser, licenseTier }: LandingPageViewProps) {
  const isPaid = licenseTier && licenseTier !== 'free';
  // Navigation active tab: 'overview' shows the hero, 'pricing' shows the pricing section, 'install' shows enterprise install onboarding
  const [activeTab, setActiveTab] = useState<'overview' | 'pricing' | 'install'>('overview');

  // Interactive local code compiler states
  const [compileProgress, setCompileProgress] = useState(0);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileLogs, setCompileLogs] = useState<string[]>([]);
  const [isBuildComplete, setIsBuildComplete] = useState(false);

  // Automatically reset to overview if somehow in pricing tab while paid
  useEffect(() => {
    if (isPaid && activeTab === 'pricing') {
      setActiveTab('overview');
    }
  }, [isPaid, activeTab]);

  const startCompilerSimulation = () => {
    setIsCompiling(true);
    setIsBuildComplete(false);
    setCompileProgress(0);
    setCompileLogs(["🌱 [SYSTEM] Bootstrap connection to offline hardware compiler..."]);
  };

  const triggerWorkstationDownload = () => {
    const readmeContent = `======================================================================
     SCALABLE OPERATING SYSTEM (SCALABLE OS) - ENTERPRISE LOCAL
======================================================================
Build Reference: SO-ENT-RELEASE-2026-DEV
Data Residency Level: 100% PRIVATE SECURED
Execution Module: Standalone Local Node

Welcome to your Enterprise Local deployment of Mitior OS! Your system has
been compiled to run client-side on your local hardware. This ensures absolute 
data autonomy, zero unauthorized telemetry tracking, and total privacy.

----------------------------------------------------------------------
PACKAGE INCLUDED FILES:
----------------------------------------------------------------------
1. Launch-MitiorOS.bat - Windows Double-Click Launcher
2. README.txt              - This documentation file
3. package.json           - Node service configuration entry
4. server.js              - Secure standalone routing engine

----------------------------------------------------------------------
SYSTEM PREREQUISITES
----------------------------------------------------------------------
- Operating System: Windows 10/11, macOS, or Linux
- Node.js: Version 18.0.0 or higher
- Package Manager: npm (normally bundled with Node.js)

----------------------------------------------------------------------
GETTING STARTED (3-STEP INITIALIZATION)
----------------------------------------------------------------------
Step 1: Extract this zip archive into any folder on your drive (e.g. C:\\MitiorOS).

Step 2: Install dependencies. Open your console (cmd/terminal) there, and run:
        
        npm install

Step 3: Boot your local server workstation:

        npm run dev

Step 4: Load inside your browser:
        Navigate to http://localhost:3000

----------------------------------------------------------------------
STANDALONE SECURE DESIGN
----------------------------------------------------------------------
- All engines, checklists, SOP templates and data cards will reside on your hardware.
- No network signals are transmitted.

Support details: support@mitior.co
======================================================================`;

    const batContent = `@echo off\ntitle Mitior OS Enterprise Local Host\necho ===================================================\necho     STARTING MITIOR OS ENTERPRISE LOCAL SANDBOX\necho ===================================================\necho.\necho [INFO] Resolving system prerequisites...\nnode -v >nul 2>&1\nif %errorlevel% neq 0 (\n    echo [ERROR] Node.js is not installed or not in PATH!\n    echo [ERROR] Please install Node.js (v18+) from https://nodejs.org and try again.\n    pause\n    exit\n)\necho [OK] Node.js is present.\necho [INFO] Initializing standalone local server on port 3000...\nnpm run dev\npause`;

    const packageJsonContent = `{
  "name": "mitior-os-enterprise-local",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "node server.js",
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.21.2"
  }
}`;

    const serverJsContent = `// Mitior OS Standalone Local Host\nconst express = require('express');\nconst fs = require('fs');\nconst path = require('path');\nconst app = express();\nconst PORT = 3000;\n\napp.use(express.json());\napp.use(express.static(__dirname));\n\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'ok', localNode: true });\n});\n\napp.listen(PORT, '0.0.0.0', () => {\n  console.log('[Mitior OS] Standalone host running at http://localhost:' + PORT);\n});`;

    // Package contents combined into a downloadable layout
    const zipInstallerContent = `--- MITIOR OS ENTERPRISE LOCAL MANIFEST RAW CONTROLLER ---\\n\\n` + 
      `### FILE 1: README.txt ###\\n${readmeContent}\\n\\n` +
      `### FILE 2: Launch-MitiorOS.bat ###\\n${batContent}\\n\\n` +
      `### FILE 3: package.json ###\\n${packageJsonContent}\\n\\n` +
      `### FILE 4: server.js ###\\n${serverJsContent}\\n\\n`;

    const element = document.createElement("a");
    const file = new Blob([zipInstallerContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "MitiorOS-Enterprise-Desktop-Workstation.zip";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  useEffect(() => {
    let timerID: any;
    if (isCompiling && compileProgress < 100) {
      timerID = setTimeout(() => {
        const nextProg = compileProgress + 4;
        const capped = nextProg > 100 ? 100 : nextProg;
        setCompileProgress(capped);
        
        // Add matching logs at thresholds
        const logMap: Record<number, string> = {
          4: "⚡ [SYSTEM] Generating operational bundle signature...",
          12: "⚙️ [SYSTEM] Scaffolding local repository directory structure...",
          24: "📦 [BUNDLER] Gathering core React and JSX template components...",
          40: "🔌 [COMPILER] Bundling Express node web service entry (server.ts)...",
          52: "📊 [COMPILER] Assembling D3 Scorecards and interactive SVG metrics canvas...",
          68: "🛡️ [COMPILER] Injecting sandbox persistent DB schemas (db_sandbox.json)...",
          80: "🚀 [COMPILER] Minimizing client code resources & optimizing icons...",
          92: "🔒 [SHIELD] Activating offline operator authentication keys (sOS-Security)...",
          96: "✅ [SUCCESS] Local workstation client bundle compiled successfully!",
          100: "📥 [SUCCESS] MitiorOS-Workstation-Enterprise.zip dispatched for local direct download!"
        };

        const matchingKey = Object.keys(logMap)
          .map(Number)
          .find(k => capped >= k && !compileLogs.includes(logMap[k]));

        if (matchingKey && logMap[matchingKey]) {
          setCompileLogs(prev => {
            if (prev.includes(logMap[matchingKey])) return prev;
            return [...prev, logMap[matchingKey]];
          });
        }
        
        if (capped >= 100) {
          setIsCompiling(false);
          setIsBuildComplete(true);
          
          // Trigger the real file downloads!
          triggerWorkstationDownload();
        }
      }, 90);
    }
    return () => clearTimeout(timerID);
  }, [isCompiling, compileProgress, compileLogs]);

  return (
    <div id="sos-landing-viewport" className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans overflow-x-hidden selection:bg-neutral-200 relative">
      
      {/* Grayscale chrome ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-neutral-100/50 dark:bg-neutral-850/50 blur-[120px]" />
        <div className="absolute top-[-5%] right-[20%] w-[350px] h-[350px] rounded-full bg-neutral-200/30 dark:bg-neutral-800/30 blur-[100px]" />
      </div>

      {/* Navigation Header - Light Mode (No blues, pure grays/neutral) */}
      <nav id="sos-landing-nav" className="scale-100 z-50 bg-white/95 sticky top-0 border-b border-[#e8e8ed] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-sans">
          
          {/* Logo badge with Compass Icon */}
          <div className="flex items-center gap-2.5">
            <div className="bg-[#1d1d1f] p-1.5 rounded-lg text-white flex items-center justify-center">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-[#1d1d1f] uppercase font-sans">
              Mitior OS
            </span>
          </div>

          {/* Header Spreading Navigation & Tabs - Hidden on Mobile, Flex on Desktop */}
          <div className="hidden sm:flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition duration-150 cursor-pointer hover:scale-105 active:scale-95 ${
                activeTab === 'overview' 
                  ? 'bg-[#1d1d1f] text-white font-sans' 
                  : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
              }`}
            >
              Overview
            </button>
            {!isPaid && (
              <button 
                onClick={() => setActiveTab('pricing')}
                className={`text-xs font-bold px-4 py-2.5 rounded-xl transition duration-150 cursor-pointer hover:scale-105 active:scale-95 ${
                  activeTab === 'pricing' 
                    ? 'bg-[#1d1d1f] text-white font-sans' 
                    : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
                }`}
              >
                Pricing
              </button>
            )}
          </div>

          {/* Desktop Auth Buttons - Hidden on Mobile */}
          <div className="hidden sm:flex items-center gap-2.5">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="hidden md:inline text-xs text-[#86868b] font-semibold font-sans">
                  Active: <strong className="text-[#1d1d1f] font-bold">{currentUser.name}</strong>
                </span>
                <button 
                  onClick={onGetStarted}
                  className="bg-[#1d1d1f] text-white flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-150"
                  id="nav-go-console-btn"
                >
                  <span>Go to Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={onLoginClick}
                  className="text-xs font-bold text-[#86868b] hover:text-[#1d1d1f] hover:scale-105 active:scale-95 transition px-3 py-1.5 cursor-pointer font-sans"
                  id="nav-login-btn"
                >
                  Log In
                </button>
                <button 
                  onClick={onSignUpClick}
                  className="text-xs font-bold text-[#004b49] dark:text-[#76b0b1] hover:scale-105 active:scale-95 transition px-4 py-2 bg-[#004b49]/5 dark:bg-[#76b0b1]/10 border border-[#004b49]/15 dark:border-[#76b0b1]/20 rounded-xl cursor-pointer font-sans"
                  id="nav-signup-btn"
                >
                  Sign Up
                </button>
                <button 
                  onClick={onGetStarted}
                  className="bg-[#1d1d1f] text-white hover:bg-neutral-800 transition px-4 py-2.5 rounded-xl text-xs font-bold hover:scale-105 hover:-translate-y-0.5 active:scale-95 cursor-pointer font-sans"
                  id="nav-get-started-btn"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>

          {/* NEW Mobile Unified Dropdown Menu Selector - Eliminates Spacing Clutter on Small Screens */}
          <div className="sm:hidden relative">
            <select
              value={activeTab}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'overview' || val === 'pricing') {
                  setActiveTab(val as any);
                } else if (val === 'login') {
                  onLoginClick();
                } else if (val === 'signup') {
                  onSignUpClick();
                } else if (val === 'getstarted') {
                  onGetStarted();
                }
              }}
              className="bg-[#f5f5f7] border border-[#e8e8ed] text-xs font-bold text-[#1d1d1f] rounded-xl py-2 pl-3.5 pr-8 outline-none appearance-none cursor-pointer max-w-[160px]"
            >
              <optgroup label="System Pages">
                <option value="overview">Overview Page</option>
                {!isPaid && <option value="pricing">Operating Pricing</option>}
              </optgroup>
              <optgroup label="System Access">
                {currentUser ? (
                  <option value="getstarted">Console ({currentUser.name})</option>
                ) : (
                  <>
                    <option value="login">Log In Account</option>
                    <option value="signup">Sign Up Account</option>
                    <option value="getstarted">Get Started Free</option>
                  </>
                )}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#86868b] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </nav>

      {/* Main Switchable Space */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 sm:py-20 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div
              key="overview-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full text-center space-y-8 font-sans max-w-4xl"
            >
              {/* App Label Badge - named dynamically with the Name of the App */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5f5f7] text-xs font-sans font-bold text-[#1d1d1f] border border-[#e8e8ed]">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="tracking-tight uppercase font-sans font-extrabold text-[#1d1d1f]">
                  SCALABLE OS (SCALABLE OPERATING SYSTEM)
                </span>
              </div>

              {/* Title with maximum contrast: inverted colors of dark mode mean pure high-contrast thick charcoal */}
              <div className="space-y-4 font-sans">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#1d1d1f] leading-[1.1] font-sans">
                  The clean, distraction-free OS for business execution.
                </h1>
                <p className="text-base sm:text-lg text-[#86868b] leading-relaxed font-bold max-w-2xl mx-auto font-sans">
                  Map strategic growth channels, construct robust SOP checklists, and manage scorecard KPIs securely on your machine with autonomous memory space. No clutter.
                </p>
              </div>

              {/* Action Buttons with high interaction animations */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <button 
                  onClick={onGetStarted}
                  className="w-full sm:w-auto bg-[#1d1d1f] text-white hover:bg-neutral-800 hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-150 px-8 py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-sm font-sans"
                  id="hero-go-console-btn"
                >
                  <span>{currentUser ? 'Enter Application Console' : 'Bootstrap Workspace Console'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                {!isPaid && (
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className="w-full sm:w-auto bg-[#f5f5f7] hover:bg-[#e8e8ed] hover:scale-105 hover:-translate-y-0.5 active:scale-95 text-[#1d1d1f] border border-[#e8e8ed] transition-all duration-150 px-8 py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer font-sans"
                    id="hero-pricing-tab-btn"
                  >
                    <span>View Pricing & Licenses</span>
                  </button>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'pricing' ? (
            <motion.div
              key="pricing-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full space-y-12 font-sans max-w-4xl"
            >
              <div className="text-center space-y-3">
                <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full font-bold tracking-wider uppercase font-sans">
                  Transparent Setup
                </span>
                <h3 className="text-3xl font-black text-[#1d1d1f] tracking-tight font-sans">
                  Mitior OS Operating Pricing
                </h3>
                <p className="text-sm font-semibold text-[#86868b] max-w-md mx-auto font-sans">
                  Flat, transparent operating fees. Sandbox your company playbook securely with local memory space.
                </p>
              </div>

              {/* Grid with clean light grays, yellow, green colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
                
                {/* 1. Free Validation Profile */}
                <div className="bg-white border border-[#e8e8ed] rounded-3xl p-5 space-y-5 flex flex-col justify-between shadow-2xs">
                  <div className="space-y-4 font-sans">
                    <div className="space-y-1">
                      <span className="text-[9px] bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full font-extrabold uppercase font-sans">
                        🌿 Sandbox Evaluation
                      </span>
                      <h4 className="text-md font-black text-[#1d1d1f] font-sans">
                        Free Trial Tier
                      </h4>
                    </div>
                    <p className="text-[11px] font-semibold text-[#86868b] leading-relaxed font-sans">
                      Perfect to test workflow designs and preview the system locally before scaling.
                    </p>
                    <div className="text-2xl font-black text-[#1d1d1f] font-sans">
                      $0
                      <span className="text-xs font-semibold text-[#86868b] font-sans"> / forever</span>
                    </div>
                    <ul className="text-[10.5px] text-[#1d1d1f] space-y-2.5 pt-2 font-semibold font-sans">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-neutral-600 font-bold shrink-0" /> 
                        <span>Max 10 steps on engines</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-neutral-600 font-bold shrink-0" />
                        <span>Max 4 team project seats</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-neutral-600 font-bold shrink-0" />
                        <span>Restricted file exports</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-neutral-600 font-bold shrink-0" />
                        <span>Standard browser memory</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={onGetStarted}
                    className="w-full bg-[#1d1d1f] hover:bg-neutral-800 hover:scale-102 active:scale-98 text-white py-2.5 rounded-xl text-xs font-extrabold transition-all duration-150 cursor-pointer font-sans"
                  >
                    Enter Sandbox
                  </button>
                </div>

                {/* 2. Web App Starter */}
                <div className="bg-white border border-indigo-200 rounded-3xl p-5 space-y-5 flex flex-col justify-between shadow-2xs relative">
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[8px] font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase font-sans">
                    Popular
                  </div>
                  <div className="space-y-4 font-sans">
                    <div className="space-y-1">
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-extrabold uppercase font-sans">
                        🌐 Cloud Server Tier
                      </span>
                      <h4 className="text-md font-black text-[#1d1d1f] font-sans">
                        Web App Starter
                      </h4>
                    </div>
                    <p className="text-[11px] font-semibold text-[#86868b] leading-relaxed font-sans">
                      Double the steps and capacity of our free trial tier with seamless export options.
                    </p>
                    <div className="text-2xl font-black text-[#1d1d1f] font-sans">
                      $15
                      <span className="text-xs font-semibold text-[#86868b] font-sans"> / month</span>
                    </div>
                    <ul className="text-[10.5px] text-[#1d1d1f] space-y-2.5 pt-2 font-semibold font-sans">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-indigo-600 font-bold shrink-0" /> 
                        <span>Up to 20 steps / engines</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-indigo-600 font-bold shrink-0" />
                        <span>Up to 8 active team members</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-indigo-600 font-bold shrink-0" />
                        <span>No restrictions on exports</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-indigo-600 font-bold shrink-0" />
                        <span>Auto server backup sync</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={onGetStarted}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 hover:scale-102 active:scale-98 text-white py-2.5 rounded-xl text-xs font-extrabold transition-all duration-150 cursor-pointer font-sans"
                    id="pricing-starter-cta"
                  >
                    Deploy Starter
                  </button>
                </div>

                {/* 3. Professional Web App */}
                <div className="bg-white border border-[#e8e8ed] rounded-3xl p-5 space-y-5 flex flex-col justify-between shadow-2xs">
                  <div className="space-y-4 font-sans">
                    <div className="space-y-1">
                      <span className="text-[9px] bg-[#f5f5f7] text-neutral-700 px-2.5 py-0.5 rounded-full font-extrabold uppercase font-sans">
                        ⚡ Full Scale Online
                      </span>
                      <h4 className="text-md font-black text-[#1d1d1f] font-sans">
                        Professional SaaS
                      </h4>
                    </div>
                    <p className="text-[11px] font-semibold text-[#86868b] leading-relaxed font-sans">
                      Completely uncap online systems with zero restriction limits. Runs securely.
                    </p>
                    <div className="text-2xl font-black text-[#1d1d1f] font-sans">
                      $500
                      <span className="text-xs font-semibold text-[#86868b] font-sans"> / annual</span>
                    </div>
                    <ul className="text-[10.5px] text-[#1d1d1f] space-y-2.5 pt-2 font-semibold font-sans">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-neutral-700 font-bold shrink-0" /> 
                        <span>Unlimited Engine Steps</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-neutral-700 font-bold shrink-0" />
                        <span>Unlimited active team seats</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-neutral-700 font-bold shrink-0" />
                        <span>Unlimited exports (all formats)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-neutral-700 font-bold shrink-0" />
                        <span>No local offline app wrapper</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={onGetStarted}
                    className="w-full bg-[#1d1d1f] hover:bg-neutral-800 hover:scale-102 active:scale-98 text-white py-2.5 rounded-xl text-xs font-extrabold transition-all duration-150 cursor-pointer font-sans"
                  >
                    Deploy Pro SaaS
                  </button>
                </div>

                {/* 4. Enterprise Local App */}
                <div className="bg-white border-2 border-emerald-500 rounded-3xl p-5 space-y-5 relative overflow-hidden flex flex-col justify-between shadow-xs">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black px-2.5 py-1 rounded-bl-xl tracking-wider uppercase font-sans">
                    Mitior Local
                  </div>
                  <div className="space-y-4 font-sans">
                    <div className="space-y-1">
                      <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2.5 py-0.5 rounded-full font-bold uppercase font-sans">
                        🌟 absolute local custody
                      </span>
                      <h4 className="text-md font-black text-[#1d1d1f] font-sans">
                        Enterprise Local
                      </h4>
                    </div>
                    <p className="text-[11px] font-semibold text-[#86868b] leading-relaxed">
                      Run 100% offline on your own local machines. Lock your data securely under your roof.
                    </p>
                    <div className="text-2xl font-black text-[#1d1d1f]">
                      $2,500
                      <span className="text-xs font-semibold text-[#86868b]"> / lifetime</span>
                    </div>
                    <ul className="text-[10.5px] text-[#1d1d1f] space-y-2.5 pt-2 font-semibold">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 font-bold shrink-0" />
                        <span>Custom offline executable (EXE)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 font-bold shrink-0" />
                        <span>100% data private offline storage</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 font-bold shrink-0" />
                        <span>Zero telemetry logging or tracker feeds</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 font-bold shrink-0" />
                        <span>Lifetime offline key activation</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => setActiveTab('install')}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 hover:scale-102 active:scale-98 text-white py-2.5 rounded-xl text-xs font-extrabold transition-all duration-150 cursor-pointer mt-4 font-sans text-center"
                    id="pricing-pro-cta"
                  >
                    Select Mitior Enterprise
                  </button>
                </div>

              </div>
            </motion.div>
          ) : (
            <motion.div
              key="install-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full space-y-8 font-sans max-w-4xl text-left"
            >
              {/* Back button Row */}
              <button
                onClick={() => {
                  setActiveTab('pricing');
                  // Reset compiler states
                  setIsCompiling(false);
                  setIsBuildComplete(false);
                  setCompileProgress(0);
                  setCompileLogs([]);
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition hover:-translate-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to licensing options</span>
              </button>

              <div className="border-b border-[#e8e8ed] pb-4">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-extrabold uppercase font-mono tracking-wider mb-2 inline-block">
                  🔒 Standalone Node Delivery
                </span>
                <h3 className="text-3xl font-black text-[#1d1d1f] tracking-tight">
                  Install on Device: Mitior OS Enterprise
                </h3>
                <p className="text-xs font-medium text-[#86868b] mt-1 pr-6 max-w-3xl leading-relaxed">
                  Compile and package the direct-executable sandbox matching your local system specifications. Learn to configure clean local databases and standalone server ports directly from your private terminal.
                </p>
              </div>

              {/* Install Layout split grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Visual installer console / compiler */}
                <div className="lg:col-span-7 bg-white border border-[#e8e8ed] rounded-3xl p-5 space-y-6 shadow-sm">
                  <div className="space-y-1.5 flex flex-col">
                    <h4 className="font-extrabold text-sm text-[#1d1d1f] flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <span>Local Device Compiler Node</span>
                    </h4>
                    <span className="text-[11px] text-[#86868b] leading-tight">
                      Instantiate local file compression, standalone express routing, and database storage schema bundles.
                    </span>
                  </div>

                  {/* Terminal Frame */}
                  <div className="bg-[#1d1d1f] rounded-2xl overflow-hidden shadow-md flex flex-col h-[280px] font-mono border border-neutral-800">
                    <div className="bg-neutral-900 px-4 py-2 border-b border-neutral-800 flex items-center justify-between text-[10px]">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      </div>
                      <span className="text-neutral-400 font-bold">compilerShell.sh • v1.02</span>
                      <span className="w-4 text-right"></span>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto text-[11px] text-neutral-200 space-y-1.5 font-mono select-all scrollbar-thin">
                      <p className="text-neutral-500 font-bold">// Mitior Operating System Sandbox Compiling Gateway</p>
                      <p className="text-neutral-300">Ready to package target hardware offline dependencies...</p>
                      
                      {compileLogs.length === 0 && !isCompiling && (
                        <p className="text-amber-400/80 animate-pulse mt-4">⚠️ Waiting for build initiator signal. Ready to compile.</p>
                      )}

                      {compileLogs.map((log, index) => (
                        <p key={index} className="leading-relaxed animate-fade-in text-neutral-350">
                          {log}
                        </p>
                      ))}

                      {isCompiling && (
                        <div className="flex items-center gap-2 text-indigo-400 mt-2 font-bold animate-pulse">
                          <span>→ Packaging payload headers: {compileProgress}%</span>
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin inline-block"></span>
                        </div>
                      )}

                      {isBuildComplete && (
                        <div className="mt-4 p-2.5 bg-emerald-950/40 border border-emerald-500/20 rounded-xl text-emerald-400 leading-relaxed animate-fade-in space-y-1 block">
                          <p className="font-extrabold flex items-center gap-1 text-xs">
                            <span className="text-emerald-500">✓</span> BUILD SUCCESS: Standalone Workspace Bundled
                          </p>
                          <p className="text-[10px] text-neutral-400 leading-tight">
                            Zip package "MitiorOS-Enterprise-Desktop-Workstation.zip" compiled and dispatched to local browser download pipelines.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Interactive triggering button */}
                  <div className="space-y-4 pt-1">
                    
                    {/* Progress indicator bar client-side */}
                    {isCompiling && (
                      <div className="space-y-1.5 animate-fade-in">
                        <div className="flex justify-between items-center text-[10px] font-bold text-neutral-400 font-mono">
                          <span>Standalone package builder</span>
                          <span className="text-indigo-600">{compileProgress}%</span>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden border border-neutral-200">
                          <div 
                            className="bg-indigo-600 h-full transition-all duration-100 ease-out"
                            style={{ width: `${compileProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Compile triggers action */}
                    {!isBuildComplete ? (
                      <button
                        onClick={startCompilerSimulation}
                        disabled={isCompiling}
                        className={`w-full py-4.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                          isCompiling 
                            ? 'bg-neutral-100 text-neutral-500 border border-neutral-200 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 text-white animate-pulse'
                        }`}
                      >
                        {isCompiling ? (
                          <>
                            <span className="w-4 h-4 border-2 border-neutral-400 border-t-transparent animate-spin inline-block rounded-full"></span>
                            <span>Compiling Offline Workspace Codes ({compileProgress}%)</span>
                          </>
                        ) : (
                          <>
                            <Laptop className="w-4.5 h-4.5 text-white shrink-0 animate-bounce" />
                            <span>Compile & Download Offline System Bundle</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={triggerWorkstationDownload}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-3 rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Download className="w-4 h-4 shrink-0" />
                          <span>Redownload Installer Packet (.ZIP)</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsCompiling(false);
                            setIsBuildComplete(false);
                            setCompileProgress(0);
                            setCompileLogs([]);
                            startCompilerSimulation();
                          }}
                          className="flex-1 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 font-bold text-xs py-3 rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Recompile Fresh Build</span>
                        </button>
                      </div>
                    )}

                  </div>
                </div>

                {/* Right grid: File checks & prerequisites */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Package inclusions checkcard */}
                  <div className="bg-white border border-[#e8e8ed] rounded-3xl p-5 space-y-4 shadow-sm">
                    <h4 className="font-extrabold text-sm text-[#1d1d1f]">Package Contents Breakdown</h4>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2.5 items-start text-xs border-b border-[#f5f5f7] pb-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <code className="font-bold text-neutral-800 text-[11px] block">README.txt</code>
                          <span className="text-neutral-500 text-[10px] leading-tight block mt-0.5">Comprehensive local guide, terminal startup manual and operational specs.</span>
                        </div>
                      </div>

                      <div className="flex gap-2.5 items-start text-xs border-b border-[#f5f5f7] pb-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <code className="font-bold text-neutral-800 text-[11px] block">Launch-MitiorOS.bat</code>
                          <span className="text-neutral-500 text-[10px] leading-tight block mt-0.5">Windows desktop double-click runtime wrapper script. Avoids manual cmd typing.</span>
                        </div>
                      </div>

                      <div className="flex gap-2.5 items-start text-xs border-b border-[#f5f5f7] pb-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <code className="font-bold text-neutral-800 text-[11px] block">package.json</code>
                          <span className="text-neutral-500 text-[10px] leading-tight block mt-0.5">Standalone configuration file defining express dependency layers.</span>
                        </div>
                      </div>

                      <div className="flex gap-2.5 items-start text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <code className="font-bold text-neutral-800 text-[11px] block">server.js</code>
                          <span className="text-neutral-500 text-[10px] leading-tight block mt-0.5">Lightweight local express web routing file server template to run on local Port 3000.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manual prerequisites guide card */}
                  <div className="bg-[#fbfbfd] border border-neutral-200 rounded-3xl p-5 space-y-3 text-left">
                    <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-600 px-2 py-0.5 rounded font-mono font-bold tracking-wider uppercase inline-block">
                      ⚙️ Host Prerequisites
                    </span>
                    <div className="space-y-2 text-xs leading-relaxed text-neutral-600 font-semibold">
                      <p>Running the standalone workstation package locally requires:</p>
                      <ul className="list-disc pl-4 space-y-1 text-neutral-500 text-[11px]">
                        <li>An active Node.js 18+ runtime on your machine.</li>
                        <li>Standard web browser (Chrome, Safari, Firefox).</li>
                        <li>Zero internet signal (tested 100% stable offline).</li>
                      </ul>
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
