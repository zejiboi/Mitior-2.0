import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  ShieldCheck, 
  ArrowRight, 
  Laptop, 
  Download, 
  Terminal, 
  Cpu, 
  CheckCircle2, 
  Settings, 
  Check 
} from 'lucide-react';

interface OnboardingPreloadViewProps {
  userName: string;
  setUserName: (name: string) => void;
  onComplete: () => void;
}

export default function OnboardingPreloadView({ 
  userName, 
  setUserName, 
  onComplete 
}: OnboardingPreloadViewProps) {
  const [step, setStep] = useState<'hello' | 'download'>('hello');
  const [downloadStep, setDownloadStep] = useState<number>(0);
  const [tempName, setTempName] = useState(userName || 'Founder');

  const handleSaveAndProceed = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
    }
    setStep('download');
  };

  const triggerDesktopDownload = () => {
    setDownloadStep(1);
    
    // Simulate compilation of the installer payload
    setTimeout(() => {
         setDownloadStep(2);
    }, 1200);

    // Create a client-side virtual file download for launch.bat
    const batchContent = `@echo off\ntitle Mitior OS\necho Launching mitior local workstation client...\nnode -v\nnpm run preview`;
    const blob = new Blob([batchContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'LaunchMitiorOS.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="sos-preload-container" className="min-h-screen bg-white text-[#1d1d1f] flex flex-col items-center justify-center relative p-6 overflow-hidden font-sans select-none transition-colors duration-200">
      {/* Premium ambient backdrop glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/2 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative max-w-xl w-full flex flex-col items-center">
        
        {/* Brand System Icon - Swiss modern monochromatic theme */}
        <motion.div 
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
          className="relative w-16 h-16 bg-[#1d1d1f] text-white rounded-2xl flex items-center justify-center shadow-lg mb-8"
        >
          <div className="absolute inset-0 rounded-2xl border border-indigo-500/10 animate-pulse" />
          <Compass className="w-8 h-8 text-white animate-spin-slow" />
        </motion.div>
 
        <AnimatePresence mode="wait">
          {step === 'hello' ? (
            <motion.div
              key="step-hello"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="text-center space-y-6 w-full flex flex-col items-center"
            >
              {/* Mitior Guard Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100/80 text-neutral-600 text-[10px] font-bold tracking-tight border border-[#e8e8ed] shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                MITIOR STATION • 100% PRIVATE LOCAL STORAGE
              </div>
 
              {/* Dynamic Title and Editable Name input */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl font-extralight tracking-tight text-[#1d1d1f] flex flex-col sm:flex-row items-center justify-center gap-2">
                  <span>Hello,</span>
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-transparent border-b-2 border-indigo-500 text-[#1d1d1f] font-extrabold hover:border-indigo-600 focus:border-indigo-600 outline-none pb-1 text-center w-full sm:w-auto max-w-sm px-2 text-3xl sm:text-4xl transition-all placeholder-neutral-400 focus:ring-0"
                    autoFocus
                  />
                </h1>
                
                <p className="text-neutral-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-semibold">
                  Welcome to Mitior OS. Manage operational playbooks, publish task steps, and evaluate scorecard KPIs with zero-latency local memory space.
                </p>
              </div>
 
              {/* Custom interaction trigger */}
              <button
                onClick={handleSaveAndProceed}
                className="group mt-4 bg-[#1d1d1f] text-white hover:bg-neutral-800 px-6 py-3.5 rounded-xl font-bold text-xs tracking-tight transition duration-155 flex items-center gap-1.5 cursor-pointer shadow-md select-none"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step-download"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="space-y-6 w-full text-left"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold tracking-tight uppercase border border-[#e8e8ed]">
                  ⚡ CONFIG INTEGRITY PORTAL
                </div>
                <h2 className="text-2xl font-black tracking-tight text-[#1d1d1f]">Run Mitior OS on Your PC</h2>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto font-medium">
                  Bootstrap offline capabilities or synch team cloud databases directly inside your physical workstation.
                </p>
              </div>

              {/* Graphical option cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-neutral-50/50 border border-[#e8e8ed] rounded-2xl flex flex-col justify-between space-y-3 shadow-2xs">
                  <div>
                    <div className="text-[9px] font-mono text-indigo-600 font-bold uppercase mb-1">OPTION A (STANDARD)</div>
                    <h3 className="text-xs font-bold text-[#1d1d1f]">Seamless Local Client</h3>
                    <p className="text-[10.5px] text-neutral-500 leading-relaxed mt-1">
                      Double-click launcher script to bypass browser memory restrictions with maximum speed.
                    </p>
                  </div>
                  <div className="pt-2 text-[10px] font-mono text-neutral-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Includes launch.bat</span>
                  </div>
                </div>

                <div className="p-5 bg-neutral-50/50 border border-[#e8e8ed] rounded-2xl flex flex-col justify-between space-y-3 shadow-2xs">
                  <div>
                    <div className="text-[9px] font-mono text-emerald-600 font-bold uppercase mb-1">OPTION B (NATIVE SHORTCUT)</div>
                    <h3 className="text-xs font-bold text-[#1d1d1f]">Desktop Build Script</h3>
                    <p className="text-[10.5px] text-neutral-500 leading-relaxed mt-1">
                      Registers automated background backups on Windows for absolute corporate records safety.
                    </p>
                  </div>
                  <div className="pt-2 text-[10px] font-mono text-neutral-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Auto installer.ps1</span>
                  </div>
                </div>
              </div>

              {/* Core trigger block */}
              <div className="p-5 bg-neutral-50/50 border border-[#e8e8ed] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Package Mitior Installer
                  </h4>
                  <p className="text-[10.5px] text-neutral-500 max-w-sm">
                    Compile the physical portable `.bat` client in one click to boot Mitior OS sandbox instantly.
                  </p>
                </div>
                
                <button
                  onClick={triggerDesktopDownload}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#1d1d1f] text-white hover:bg-neutral-800 text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                >
                  {downloadStep === 0 && (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Launcher</span>
                    </>
                  )}
                  {downloadStep === 1 && (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Bundling...</span>
                    </>
                  )}
                  {downloadStep === 2 && (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ready! launch.bat</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action layout footer for complete */}
              <div className="pt-4 border-t border-[#e8e8ed] flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-[10px] text-neutral-400 font-mono">
                  All enterprise structures remain proprietary to you.
                </span>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setStep('hello')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-neutral-500 hover:text-[#1d1d1f] transition text-xs font-bold cursor-pointer border border-[#e8e8ed]"
                  >
                    &larr; Back
                  </button>
                  <button
                    onClick={onComplete}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/10"
                  >
                     <span>Launch Console</span>
                     <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
 
      </div>
    </div>
  );
}

