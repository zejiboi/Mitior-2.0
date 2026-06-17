import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, ArrowRight, Building2, Sparkles, Laptop } from 'lucide-react';

interface WorkspaceSelectorViewProps {
  userName: string;
  onSetupComplete: (setup: {
    role: 'ceo' | 'employee';
    workspaceName: string;
    workspaceDesc: string;
    shouldPreloadData: boolean;
  }) => void;
}

export default function WorkspaceSelectorView({
  userName,
  onSetupComplete
}: WorkspaceSelectorViewProps) {
  const [selectedRole, setSelectedRole] = useState<'ceo' | 'employee' | null>(null);

  // CEO Form states
  const [companyName, setCompanyName] = useState(`${userName}'s Workspace`);
  const [companyDesc, setCompanyDesc] = useState('My clean local business operating workspace.');

  // Employee Selection states
  const [customWorkspaceCode, setCustomWorkspaceCode] = useState('');

  // Live verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    projectName: string;
    creatorName: string;
    projectId: string;
    description: string;
  } | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  React.useEffect(() => {
    const code = customWorkspaceCode.trim().toUpperCase();
    if (!code || code.length < 8) {
      setVerificationResult(null);
      setVerificationError(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsVerifying(true);
      setVerificationError(null);
      try {
        const res = await fetch(`/api/sync-codes/verify/${encodeURIComponent(code)}`);
        const data = await res.json();
        if (res.ok) {
          setVerificationResult({
            projectName: data.projectName,
            creatorName: data.creatorName,
            projectId: data.projectId,
            description: data.description
          });
        } else {
          setVerificationResult(null);
          setVerificationError(data.error || "Invalid synchronization code.");
        }
      } catch {
        setVerificationResult(null);
        setVerificationError("Verification service network fault.");
      } finally {
        setIsVerifying(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [customWorkspaceCode]);

  const handleProceed = () => {
    if (!selectedRole) return;

    if (selectedRole === 'ceo') {
      onSetupComplete({
        role: 'ceo',
        workspaceName: companyName.trim() || `${userName}'s Workspace`,
        workspaceDesc: companyDesc.trim() || 'Custom operating workspace.',
        shouldPreloadData: true // Always initialize all data
      });
    } else {
      // Employee role joining a workspace
      const joinedName = verificationResult
        ? `${verificationResult.projectName} Node`
        : (customWorkspaceCode.trim() 
            ? `${customWorkspaceCode.trim()} Node` 
            : `Employee Workspace Node`);
      
      const joinedDesc = verificationResult
        ? `${verificationResult.description} (Connected via Active Sync Code)`
        : "Secure employee operational node. Action privileges restricted.";

      onSetupComplete({
        role: 'employee',
        workspaceName: joinedName,
        workspaceDesc: joinedDesc,
        shouldPreloadData: true // Always initialize all data
      });
    }
  };

  return (
    <div id="workspace-selector-viewport" className="min-h-screen bg-[#f5f5f7] dark:bg-[#05161a] text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center justify-center p-6 relative overflow-hidden font-sans select-none transition-colors duration-200">
      
      {/* Background radial gradients for ambient space lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,75,73,0.02)_0%,transparent_75%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#004b49]/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-[#76b0b1]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-4xl w-full space-y-8 animate-fade-in z-10">
        
        {/* Header Block */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0d1e22] text-neutral-600 dark:text-[#76b0b1] text-[9.5px] font-extrabold tracking-widest uppercase border border-[#e8e8ed] dark:border-[#3f4948] shadow-2xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-[#004b49] dark:text-[#76b0b1]" />
            PARTITION INITIALIZATION PROTOCOL
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-medium tracking-tight text-[#1a3038] dark:text-white leading-tight">
            Configure Your Workspace Node
          </h1>
          <p className="text-xs sm:text-sm text-[#4f5e61] dark:text-[#bfc8c7] max-w-lg mx-auto leading-relaxed">
            Welcome back, <strong className="text-[#05161a] dark:text-[#76b0b1] font-bold">{userName}</strong>. Select your core structural role to deploy the corporate sandbox workspace.
          </p>
        </div>

        {/* Step 1: Choose Role Dual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card A: CEO / Admin */}
          <div 
            onClick={() => setSelectedRole('ceo')}
            className={`p-6 sm:p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 relative overflow-hidden group ${
              selectedRole === 'ceo'
                ? 'border-[#004b49] dark:border-[#76b0b1] bg-white dark:bg-[#0d1e22] shadow-xl scale-102'
                : 'border-[#e8e8ed] dark:border-[#112226] bg-white/70 dark:bg-[#0d1e22]/50 hover:border-[#004b49]/40 dark:hover:border-[#76b0b1]/40 hover:-translate-y-0.5 hover:shadow-xs'
            }`}
          >
            {selectedRole === 'ceo' && (
              <div className="absolute top-0 right-0 bg-[#004b49] dark:bg-[#76b0b1] text-white dark:text-[#05161a] px-4 py-1.5 text-[9px] font-mono font-bold uppercase rounded-bl-xl tracking-wider">
                Active Selection
              </div>
            )}
            
            <div className="space-y-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition duration-300 ${
                selectedRole === 'ceo' 
                  ? 'bg-[#004b49]/10 dark:bg-[#76b0b1]/20 text-[#004b49] dark:text-[#76b0b1]' 
                  : 'bg-neutral-100 dark:bg-[#112226] text-neutral-400 dark:text-neutral-500 group-hover:bg-[#004b49]/5'
              }`}>
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-display font-semibold tracking-tight text-[#05161a] dark:text-white">
                  Create Workspace as Administrator
                </h3>
                <p className="text-xs text-[#4f5e61] dark:text-[#899391] leading-relaxed font-normal">
                  Possess full administrative execution and override rights. Formulate core values, build target benchmarks, issue team membership records, and author SOP playbooks.
                </p>
              </div>
            </div>

            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#004b49] dark:bg-[#76b0b1]" />
              Full privilege deployment
            </div>
          </div>

          {/* Card B: Employee / Teammate */}
          <div 
            onClick={() => setSelectedRole('employee')}
            className={`p-6 sm:p-8 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 relative overflow-hidden group ${
              selectedRole === 'employee'
                ? 'border-[#004b49] dark:border-[#76b0b1] bg-white dark:bg-[#0d1e22] shadow-xl scale-102'
                : 'border-[#e8e8ed] dark:border-[#112226] bg-white/70 dark:bg-[#0d1e22]/50 hover:border-[#004b49]/40 dark:hover:border-[#76b0b1]/40 hover:-translate-y-0.5 hover:shadow-xs'
            }`}
          >
            {selectedRole === 'employee' && (
              <div className="absolute top-0 right-0 bg-[#004b49] dark:bg-[#76b0b1] text-white dark:text-[#05161a] px-4 py-1.5 text-[9px] font-mono font-bold uppercase rounded-bl-xl tracking-wider">
                Active Selection
              </div>
            )}

            <div className="space-y-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition duration-300 ${
                selectedRole === 'employee' 
                  ? 'bg-[#004b49]/10 dark:bg-[#76b0b1]/20 text-[#004b49] dark:text-[#76b0b1]' 
                  : 'bg-neutral-100 dark:bg-[#112226] text-neutral-400 dark:text-neutral-500 group-hover:bg-[#004b49]/5'
              }`}>
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-display font-semibold tracking-tight text-[#05161a] dark:text-white">
                  Join Workspace as Employee
                </h3>
                <p className="text-xs text-[#4f5e61] dark:text-[#899391] leading-relaxed font-normal">
                  Execute SOP guidelines, monitor assigned corporate tasks, fulfill standard benchmark KPIs, and log weekly performance checklists inside active sprint frames.
                </p>
              </div>
            </div>

            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#004b49] dark:bg-[#76b0b1]" />
              Staff execution focus
            </div>
          </div>

        </div>

        {/* Step 2: Role Options Sub-Forms */}
        {selectedRole && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 sm:p-8 bg-white dark:bg-[#0d1e22] border border-[#e8e8ed] dark:border-[#3f4948] rounded-3xl space-y-6 shadow-md"
          >
            
            {/* CEO Custom Configuration Form */}
            {selectedRole === 'ceo' && (
              <div className="space-y-5">
                <h3 className="text-sm font-display font-bold text-[#05161a] dark:text-white flex items-center gap-2 tracking-tight">
                  <Building2 className="w-4 h-4 text-[#004b49] dark:text-[#76b0b1]" />
                  Administrator Workspace Settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-sans">
                  <div className="space-y-1.5">
                    <label className="text-[#4f5e61] dark:text-[#bfc8c7] font-bold block uppercase tracking-wider text-[10px]">Company / Workspace Name</label>
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-neutral-50 dark:bg-[#05161a] border border-[#e8e8ed] dark:border-[#3f4948] focus:border-[#004b49] dark:focus:border-[#76b0b1] rounded-xl px-4 py-3 outline-none text-[#05161a] dark:text-white text-xs transition focus:ring-2 focus:ring-[#004b49]/10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[#4f5e61] dark:text-[#bfc8c7] font-bold block uppercase tracking-wider text-[10px]">Short Purpose Description</label>
                    <input 
                      type="text" 
                      value={companyDesc}
                      onChange={(e) => setCompanyDesc(e.target.value)}
                      placeholder="e.g. Standard business operational hub."
                      className="w-full bg-neutral-50 dark:bg-[#05161a] border border-[#e8e8ed] dark:border-[#3f4948] focus:border-[#004b49] dark:focus:border-[#76b0b1] rounded-xl px-4 py-3 outline-none text-[#05161a] dark:text-white text-xs transition focus:ring-2 focus:ring-[#004b49]/10"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Employee Joining Form */}
            {selectedRole === 'employee' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-display font-bold text-[#05161a] dark:text-white flex items-center gap-2 tracking-tight">
                    <Laptop className="w-4 h-4 text-[#004b49] dark:text-[#76b0b1]" />
                    Connect Workspace Node
                  </h3>
                  <p className="text-[11px] text-[#4f5e61] dark:text-[#899391]">
                    Synergy starts here. Enter a valid Synchronization Code issued by your Administrator to download shared playbooks and track operational vitals.
                  </p>
                </div>

                {/* Custom code entry */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#4f5e61] dark:text-[#bfc8c7] block uppercase tracking-wider">Sync Code / Custom Hub Tag</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={customWorkspaceCode}
                      onChange={(e) => setCustomWorkspaceCode(e.target.value)}
                      placeholder="e.g. S-OS-XXXX-YYYY"
                      className="bg-neutral-50 dark:bg-[#05161a] border border-[#e8e8ed] dark:border-[#3f4948] focus:border-[#004b49] dark:focus:border-[#76b0b1] rounded-xl px-4 py-3 outline-none text-[#05161a] dark:text-white text-xs font-mono tracking-wider flex-1 focus:ring-2 focus:ring-[#004b49]/10"
                    />
                  </div>

                  {isVerifying && (
                    <div className="text-[10.5px] text-[#004b49] dark:text-[#76b0b1] font-semibold flex items-center gap-1.5 animate-pulse font-mono">
                      <span>⏳</span>
                      <span>Verifying workspace synchronization token...</span>
                    </div>
                  )}

                  {verificationError && (
                    <div className="text-[10.5px] text-red-600 bg-red-50/50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-200 dark:border-red-900/30 leading-snug font-medium">
                      ❌ {verificationError}
                    </div>
                  )}

                  {verificationResult && (
                    <div className="text-[11px] text-emerald-800 dark:text-[#00bfa5] bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20 leading-relaxed space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="text-emerald-500">🌌</span>
                        <span>Authorized connection verified to:</span>
                        <span className="underline font-extrabold">{verificationResult.projectName}</span>
                      </div>
                      <div className="text-[10.5px] text-neutral-500 dark:text-[#899391] font-medium pl-5">
                        Admin authorization issued by CEO <strong>{verificationResult.creatorName}</strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-4 border-t border-[#e8e8ed] dark:border-[#3f4948]">
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono font-medium">
                🔒 Mitior Local Sandboxing Active
              </span>
              <button
                onClick={handleProceed}
                className="px-6 py-3 rounded-xl bg-[#004b49] hover:bg-[#0e5153] dark:bg-[#76b0b1] dark:hover:bg-[#95d1ce] text-white dark:text-[#05161a] font-extrabold text-xs tracking-wide transition duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-103 hover:-translate-y-0.5 active:scale-97"
                id="workspace-setup-launch-btn"
              >
                <span>Launch Operational Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </motion.div>
        )}

      </div>
    </div>
  );
}
