import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Laptop, 
  Terminal, 
  Copy, 
  Check, 
  ShieldCheck, 
  Database,
  CloudLightning,
  ChevronRight,
  ExternalLink,
  Cpu,
  Monitor,
  Command,
  HelpCircle,
  X
} from 'lucide-react';
// @ts-ignore
import desktopDiagram from '../assets/images/desktop_installer_diagram_1780836504733.png';

interface DesktopInstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DesktopInstallerModal({ isOpen, onClose }: DesktopInstallerModalProps) {
  const [activeOS, setActiveOS] = useState<'windows' | 'macos'>('windows');
  const [copiedText, setCopiedText] = useState<'windows_run' | 'mac_clone' | 'npm_run' | null>(null);

  const handleCopy = (text: string, key: 'windows_run' | 'mac_clone' | 'npm_run') => {
    navigator.clipboard.writeText(text);
    setCopiedText(key);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 md:p-10">
        
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#1d1d1f]/45 backdrop-blur-sm"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white dark:bg-[#1d1d1f] w-full max-w-4xl rounded-3xl border border-neutral-100 dark:border-[#2d2d2f] shadow-2xl overflow-hidden text-[#1d1d1f] dark:text-[#f5f5f7] flex flex-col max-h-[90vh]"
          id="desktop-installer-modal-cnt"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/10">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 dark:bg-indigo-500 p-2 rounded-xl text-white">
                <Laptop className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-base font-bold tracking-tight">Desktop Autonomy & Local setup Portal</h2>
                <p className="text-[11px] text-[#86868b] font-medium leading-none">Run your private operating workspace offline with absolute safety.</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Close and Enter Workstation Console"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            {/* Quick Core recommendation highlight cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-emerald-50/60 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>How secure is my data?</span>
                  </div>
                  <p className="text-[11px] text-neutral-650 dark:text-neutral-350 leading-relaxed">
                    By default, this OS runs entirely **local-first** on sandboxed localized browser cache. Secret KPIs, finances, and playbooks never transmit to a third-party server.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-500 font-bold mt-2">
                  ✓ 100% Client-Side Privacy
                </div>
              </div>

              <div className="bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-150/40 dark:border-indigo-900/30 rounded-2xl p-4 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-400 font-bold text-xs">
                    <Database className="w-4 h-4 shrink-0" />
                    <span>Can I use a Cloud database?</span>
                  </div>
                  <p className="text-[11px] text-neutral-650 dark:text-neutral-350 leading-relaxed">
                    Yes! For teams, we recommend deploying a relational **PostgreSQL** instance or a secure **Cloud Firestore** synced with our authentication rules framework.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-indigo-700 dark:text-indigo-500 font-bold mt-2">
                  ⚡ Ready to scale to SAAS
                </div>
              </div>

              <div className="bg-amber-50/60 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs">
                    <Cpu className="w-4 h-4 shrink-0" />
                    <span>How do I install locally?</span>
                  </div>
                  <p className="text-[11px] text-neutral-650 dark:text-neutral-350 leading-relaxed">
                    The app is fully pre-compiled and portable. Simply download the codebase archive and run the native double-click setup. No terminal experience required.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-amber-700 dark:text-amber-500 font-bold mt-2">
                  📁 Dual OS Launch Scripts
                </div>
              </div>

            </div>

            {/* Split layout: Setup Steps and generated high density installer infographic */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch border-t border-b border-neutral-100 dark:border-neutral-800 py-6">
              
              {/* Left Grid: Instruction Stepper Tab Container */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    Step-by-Step Desktop Launch Guide
                  </h3>
                  
                  {/* Tab Selector */}
                  <div className="flex border-b border-neutral-100 dark:border-neutral-800 gap-4 text-xs font-semibold">
                    <button
                      onClick={() => setActiveOS('windows')}
                      className={`pb-2.5 transition relative cursor-pointer ${activeOS === 'windows' ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5" />
                        Windows installation (Auto)
                      </span>
                      {activeOS === 'windows' && <motion.div layoutId="installerOSUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                    </button>
                    <button
                      onClick={() => setActiveOS('macos')}
                      className={`pb-2.5 transition relative cursor-pointer ${activeOS === 'macos' ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Command className="w-3.5 h-3.5" />
                        macOS / Linux setup
                      </span>
                      {activeOS === 'macos' && <motion.div layoutId="installerOSUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                    </button>
                  </div>

                  {/* Windows Tab content */}
                  {activeOS === 'windows' ? (
                    <div className="space-y-3.5 text-xs animate-fade-in pr-2">
                      <div className="space-y-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 p-3 rounded-2xl">
                        <p className="text-[10px] text-neutral-400 font-mono">⚡ QUICK AUTOMATED LAUNCH LINE</p>
                        <p className="text-[11px] leading-relaxed font-medium">To compile offline build assets and generate a **Desktop Shortcut** automatically:</p>
                        <div className="relative mt-2 flex items-center bg-white dark:bg-[#161617] p-2 border border-neutral-150 dark:border-neutral-800 rounded-xl">
                          <code className="text-[10.5px] font-mono text-indigo-600 dark:text-indigo-400 flex-1 break-all overflow-x-auto select-all pr-2">
                            powershell -ExecutionPolicy Bypass -File .\installer.ps1
                          </code>
                          <button
                            onClick={() => handleCopy('powershell -ExecutionPolicy Bypass -File .\\installer.ps1', 'windows_run')}
                            className="bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200/40 dark:border-neutral-700/50 p-1.5 rounded-lg text-neutral-500 cursor-pointer transition shrink-0"
                            title="Copy installer snippet"
                          >
                            {copiedText === 'windows_run' ? <Check className="w-3.5 h-3.5 text-green-500 animate-pulse" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Explicit steps */}
                      <div className="space-y-2 font-sans">
                        <div className="flex gap-2.5 items-start">
                          <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400 h-5 w-5 rounded-full flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">1</span>
                          <p className="leading-relaxed">
                            **Move Code to local drive**: Download the ZIP of the workstation code or export it from the top-right Settings dropdown, and extract it on your target PC.
                          </p>
                        </div>
                        <div className="flex gap-2.5 items-start">
                          <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400 h-5 w-5 rounded-full flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">2</span>
                          <p className="leading-relaxed">
                            **Run local Launcher**: Double-click the file named `launch.bat` in the folder root. If warning messages appear from Windows Defender, click "More info" -&gt; "Run anyway".
                          </p>
                        </div>
                        <div className="flex gap-2.5 items-start">
                          <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400 h-5 w-5 rounded-full flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">3</span>
                          <p className="leading-relaxed">
                            **Launch Desktop App**: The script installs Node.js runtime, bundles database assets locally, and spawns a standalone Chrome-app workspace window on your monitor!
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // MacOS content
                    <div className="space-y-3.5 text-xs animate-fade-in pr-2">
                       <div className="space-y-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 p-3 rounded-2xl">
                        <p className="text-[10px] text-neutral-400 font-mono">⚡ MACOS TERMINAL RUN COMMANDS</p>
                        <p className="text-[11px] leading-relaxed font-semibold">Open Terminal inside the directory folder, and install & start:</p>
                        
                        <div className="space-y-2 mt-2">
                          <div className="relative flex items-center bg-white dark:bg-[#161617] p-2 border border-neutral-150 dark:border-neutral-800 rounded-xl">
                            <code className="text-[10.5px] font-mono text-indigo-600 dark:text-indigo-400 flex-1 select-all break-all pr-2">
                              npm install && npm run build
                            </code>
                            <button
                              onClick={() => handleCopy('npm install && npm run build', 'mac_clone')}
                              className="bg-neutral-50 dark:bg-neutral-800 p-1.5 rounded-lg text-neutral-500 cursor-pointer"
                            >
                              {copiedText === 'mac_clone' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          
                          <div className="relative flex items-center bg-white dark:bg-[#161617] p-2 border border-neutral-150 dark:border-neutral-800 rounded-xl">
                            <code className="text-[10.5px] font-mono text-indigo-600 dark:text-indigo-400 flex-1 select-all break-all pr-2">
                              npm run preview -- --port 3000
                            </code>
                            <button
                              onClick={() => handleCopy('npm run preview -- --port 3000', 'npm_run')}
                              className="bg-neutral-50 dark:bg-neutral-800 p-1.5 rounded-lg text-neutral-500 cursor-pointer"
                            >
                              {copiedText === 'npm_run' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 font-sans">
                        <div className="flex gap-2.5 items-start">
                          <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400 h-5 w-5 rounded-full flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">1</span>
                          <p className="leading-relaxed">
                            **Prerequisite**: Ensure Node.js is installed. (You can download the Mac installer from stable node packages at `nodejs.org`).
                          </p>
                        </div>
                        <div className="flex gap-2.5 items-start">
                          <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400 h-5 w-5 rounded-full flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">2</span>
                          <p className="leading-relaxed">
                            **Local Sandbox Setup**: Open the folder inside your Terminal, run the commands above, and load the high-fidelity secure dashboard on native `http://localhost:3000`.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Additional support guidelines for local DB security */}
                <div className="bg-neutral-50 dark:bg-neutral-800/20 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-start gap-2 text-[10px] text-neutral-500 leading-relaxed max-w-full">
                  <HelpCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                  <span>
                    **Enterprise SAAS notice**: This layout serves ideally as a turn-key operational template. By adding a Firebase project ID or Relational PostgreSQL string in `.env`, you can easily synchronize files, assign login metrics to multi-user employee logins, and commercialize this application.
                  </span>
                </div>
              </div>

              {/* Right Grid: High-Fidelity Infographic / Laptop Mockup Frame */}
              <div className="lg:col-span-5 flex flex-col justify-center items-center bg-[#fbfbfd] dark:bg-neutral-800/10 rounded-2xl border border-neutral-150 dark:border-neutral-850 p-4">
                <div className="space-y-2 text-center w-full">
                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-400 font-bold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider inline-block">
                    Architectural Layout
                  </span>
                  <div className="relative group rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#161617] p-1.5 shadow-md">
                    <img
                      src={desktopDiagram}
                      alt="Local Mitior Installation Diagram"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto rounded-lg object-contain block group-hover:scale-[1.02] transitionDuration-250"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 pointer-events-none">
                      <span className="text-white text-[9px] font-semibold font-sans tracking-wide">
                        Double-click double-layer launch process
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-sans italic">
                    Offline Sandbox Transfer Diagram
                  </p>
                </div>
              </div>

            </div>

            {/* Bottom Actions banner */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto bg-[#1d1d1f] hover:bg-neutral-800 text-white dark:bg-white dark:text-[#1d1d1f] text-xs font-bold px-6 py-3 rounded-2xl cursor-pointer hover:scale-105 active:scale-95 transition flex items-center justify-center gap-1.5"
                  id="installer-dismiss-enter-console"
                >
                  Confirm and Launch Mitior Workbench
                  <ChevronRight className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />
                </button>
              </div>
            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
