import { useState } from 'react';
import { 
  Layers, 
  FileCheck2, 
  Users, 
  TrendingUp, 
  Compass, 
  ShieldCheck, 
  ArrowRight,
  BarChart4,
  PieChart as PieIcon,
  Activity,
  HeartPulse,
  Sparkles,
  Inbox,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Briefcase,
  Target,
  FileText,
  BadgeAlert,
  ArrowUpRight,
  TrendingDown,
  UserCheck,
  Award,
  Lock,
  Unlock,
  History
} from 'lucide-react';
import { 
  Playbook, 
  TeamMember, 
  ScorecardMetric, 
  SprintPlan, 
  ClarityCompass,
  RecentActivity
} from '../types';
import { Enquiry } from './EnquiriesView';
import OnboardingWizard from './OnboardingWizard';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DashboardOverviewProps {
  playbooks: Playbook[];
  teamMembers: TeamMember[];
  scorecard: ScorecardMetric[];
  sprintPlan: SprintPlan;
  compass: ClarityCompass;
  enquiries?: Enquiry[];
  onSetActiveTab: (tab: string) => void;
  onSelectPlaybook?: (id: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  userRole?: 'ceo' | 'employee';
  activities?: RecentActivity[];
  onClearActivities?: () => void;
  onUpdateTeam?: (updated: TeamMember[]) => void;
  onUpdatePlaybooks?: (updated: Playbook[]) => void;
}

export default function DashboardOverview({
  playbooks = [],
  teamMembers = [],
  scorecard = [],
  sprintPlan,
  compass,
  enquiries = [],
  onSetActiveTab,
  onSelectPlaybook,
  userName,
  setUserName,
  userRole = 'ceo',
  activities = [],
  onClearActivities,
  onUpdateTeam,
  onUpdatePlaybooks,
}: DashboardOverviewProps) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [diagScanActive, setDiagScanActive] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'playbook' | 'scorecard' | 'team'>('all');
  const [diagScanResult, setDiagScanResult] = useState<{
    score: number;
    grade: string;
    advices: string[];
  } | null>(null);

  const [showOnboardingWizard, setShowOnboardingWizard] = useState(() => {
    return localStorage.getItem('sOS_onboarding_wizard_done') !== 'true';
  });

  const triggerDiagnosticScan = () => {
    setDiagScanActive(true);
    setTimeout(() => {
      // Calculate real scores based on actual data!
      let scoreReduction = 0;
      const advices: string[] = [];

      // Blocked steps reduction
      const blockedStepsCount = playbooks.reduce((acc, p) => 
        acc + (p.steps ? p.steps.filter(s => !s.done && s.dependsOnStepId && p.steps.find(o => o.id === s.dependsOnStepId && !o.done)).length : 0), 0
      );
      if (blockedStepsCount > 0) {
        scoreReduction += Math.min(25, blockedStepsCount * 5);
        advices.push(`Resolve the ${blockedStepsCount} checklist dependency blockages in your Playbooks to unlock team workflows.`);
      }

      // Yellow/Red KPIs
      const badKPIs = scorecard.filter(m => m.status === 'RED' || m.status === 'YELLOW');
      if (badKPIs.length > 0) {
        scoreReduction += Math.min(30, badKPIs.length * 8);
        const redCount = scorecard.filter(m => m.status === 'RED').length;
        advices.push(`Address ${badKPIs.length} under-performing metrics (${redCount} critical red status on Mondays actuals) on your Scorecard.`);
      } else if (scorecard.length === 0) {
        scoreReduction += 15;
        advices.push("Configure basic weekly metrics on your Scorecard to build structural reporting pipelines.");
      }

      // Founder Bottlenecks
      if (founderCabinCount > 2) {
        scoreReduction += 20;
        advices.push(`Scale founder-delegated cabins; your Founder has active liability for ${founderCabinCount} vital operations.`);
      }

      // Compass state
      if (!compass || !compass.purposeStatement) {
        scoreReduction += 10;
        advices.push("Establish structural purpose statement within your Clarity Compass to guide strategic focus.");
      }

      const finalScore = Math.max(10, 100 - scoreReduction);
      let grade = "Premium Mitior (A)";
      if (finalScore < 50) grade = "Extreme Friction (F)";
      else if (finalScore < 70) grade = "Founder Overloaded (C)";
      else if (finalScore < 85) grade = "Operational Inflow (B)";

      setDiagScanResult({
        score: finalScore,
        grade,
        advices: advices.length > 0 ? advices : ["All clear! Your Mitior enterprise pipelines are operating with maximum efficiency."]
      });
      setDiagScanActive(false);
    }, 900);
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName);
      setEditingName(false);
    }
  };

  // --- CORE METRICS CALCULATIONS ---
  
  // Scorecard / KPI calculations
  const totalKPIs = scorecard.length;
  const greenKPIs = scorecard.filter(m => m.status === 'GREEN').length;
  const yellowKPIs = scorecard.filter(m => m.status === 'YELLOW').length;
  const redKPIs = scorecard.filter(m => m.status === 'RED').length;
  const scorecardHealth = totalKPIs > 0 ? Math.round((greenKPIs / totalKPIs) * 100) : 0;

  // Playbooks / SOPs progress
  const totalPlaybooks = playbooks.length;
  const linkedPlaybooks = playbooks.filter(p => p.powerStageId).length;
  
  // Calculate average checklist step completion rate
  let totalSteps = 0;
  let completedSteps = 0;
  playbooks.forEach(p => {
    if (p.steps && p.steps.length > 0) {
      totalSteps += p.steps.length;
      completedSteps += p.steps.filter(s => s.done).length;
    }
  });
  const stepCompletionRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Sprint Initiatives progress
  const totalInitiatives = sprintPlan?.initiatives?.length || 0;
  const accomplishedInitiatives = sprintPlan?.initiatives?.filter(i => i.status === 'Accomplished').length || 0;
  const onTrackInitiatives = sprintPlan?.initiatives?.filter(i => i.status === 'On-Track').length || 0;
  const behindInitiatives = sprintPlan?.initiatives?.filter(i => i.status === 'Behind').length || 0;
  const sprintProgressPercent = totalInitiatives > 0 
    ? Math.round(((accomplishedInitiatives + onTrackInitiatives * 0.5) / totalInitiatives) * 100) 
    : 0;

  // Team Canvas delegation (Founder Bottleneck stats)
  const founderMember = teamMembers.find(m => m.isFounder);
  const founderCabinCount = founderMember ? founderMember.accountabilities.length : 0;
  const totalTeamMembers = teamMembers.length;
  
  // Calculate total delegated accountabilities overall
  let totalAccountabilitiesCount = 0;
  teamMembers.forEach(m => {
    totalAccountabilitiesCount += m.accountabilities?.length || 0;
  });
  const delegationRate = totalAccountabilitiesCount > 0 
    ? Math.round(((totalAccountabilitiesCount - founderCabinCount) / totalAccountabilitiesCount) * 100) 
    : 100;

  // Enquiries stats
  const totalEnquiries = enquiries.length;
  const newEnquiriesCount = enquiries.filter(e => e.status === 'New').length;
  const pendingEnquiriesCount = enquiries.filter(e => e.status === 'In-Progress').length;
  const addressedEnquiriesCount = enquiries.filter(e => e.status === 'Addressed').length;

  // Track all blocked playbook steps
  const blockedSteps: { playbookId: string; playbookTitle: string; stepId: string; stepText: string; blockerText: string }[] = [];
  playbooks.forEach(p => {
    if (p.steps) {
      p.steps.forEach(s => {
        if (!s.done && s.dependsOnStepId) {
          const blocker = p.steps.find(other => other.id === s.dependsOnStepId);
          if (blocker && !blocker.done) {
            blockedSteps.push({
              playbookId: p.id,
              playbookTitle: p.title,
              stepId: s.id,
              stepText: s.text,
              blockerText: blocker.text
            });
          }
        }
      });
    }
  });

  // Recharts Bar chart data mapping
  const playbookChartData = playbooks.map(p => {
    const total = p.steps ? p.steps.length : 0;
    const completed = p.steps ? p.steps.filter(s => s.done).length : 0;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Extract short SOP prefix (e.g. SOP-101) or truncate text
    const sopMatch = p.title.match(/(SOP-\d+)/);
    const label = sopMatch ? sopMatch[1] : p.title.slice(0, 10) + '...';
    return {
      name: label,
      fullName: p.title,
      'Completion %': percent,
      completed,
      total
    };
  });

  // Recharts KPI distribution data mapping
  const kpiDistributionData = [
    { name: 'Healthy (Green)', value: greenKPIs || (totalKPIs === 0 ? 3 : 0), color: '#10b981' },
    { name: 'Warning (Yellow)', value: yellowKPIs || (totalKPIs === 0 ? 1 : 0), color: '#f5a623' },
    { name: 'Critical (Red)', value: redKPIs || (totalKPIs === 0 ? 1 : 0), color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Custom tooltips
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#1d1d1f] p-3 border border-[#e8e8ed] dark:border-neutral-800 rounded-xl shadow-lg text-xs leading-relaxed max-w-xs font-sans">
          <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{data.fullName}</p>
          <p className="text-[#86868b] mt-1">Completeness: <strong className="text-[#1d1d1f] dark:text-white">{data['Completion %']}%</strong></p>
          <p className="text-[#86868b]">Steps Verified: <strong className="text-[#1d1d1f] dark:text-white">{data.completed} of {data.total}</strong></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      
      {/* 1. Header Hero Panel with dynamic name editing and user role toggle */}
      <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIVE OS PARTITION RUNNING
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">
              Welcome back, {editingName ? (
                <span className="inline-flex items-center gap-1">
                  <input 
                    type="text" 
                    value={tempName} 
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="border border-[#e8e8ed] dark:border-neutral-400 bg-white dark:bg-white px-3 py-1 rounded-xl text-sm text-[#1d1d1f] dark:text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold shadow-xs"
                    autoFocus
                  />
                  <button 
                    onClick={handleSaveName}
                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2.5 py-0.5 rounded text-xs font-bold hover:opacity-90 cursor-pointer"
                  >
                    Save
                  </button>
                </span>
              ) : (
                <span 
                  onClick={() => { setTempName(userName); setEditingName(true); }}
                  className="underline decoration-dotted cursor-pointer decoration-neutral-400 hover:text-blue-500 transition-colors"
                  title="Click to change name"
                >
                  {userName}
                </span>
              )}
            </h1>
            <span className="text-xs text-[#86868b] font-medium bg-[#f5f5f7] dark:bg-[#252526] px-2.5 py-1 rounded-full border border-[#e8e8ed] dark:border-neutral-800 capitalize">
              Role: <strong className="text-[#1d1d1f] dark:text-white">{userRole}</strong>
            </span>
          </div>
          <p className="text-xs text-[#86868b] max-w-2xl leading-relaxed">
            This dashboard aggregates operational KPIs, strategic initiative progress, SOP completeness metrics, and delegation levels from your local Mitior workstation.
          </p>
        </div>

        <div className="flex gap-2.5 shrink-0 w-full md:w-auto">
          <button
            onClick={() => onSetActiveTab('scorecard')}
            className="flex-1 md:flex-none text-center bg-[#1d1d1f] dark:bg-[#f5f5f7] text-white dark:text-[#1d1d1f] px-4 py-2.5 rounded-xl text-xs font-extrabold cursor-pointer hover:opacity-90 active:scale-95 transition-all duration-150 flex items-center justify-center gap-1"
          >
            Update Scorecard
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSetActiveTab('playbooks')}
            className="flex-1 md:flex-none text-center bg-[#f5f5f7] dark:bg-neutral-800 text-[#1d1d1f] dark:text-[#f5f5f7] border border-[#e8e8ed] dark:border-neutral-700 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer hover:bg-[#e8e8ed] dark:hover:bg-neutral-700 active:scale-95 transition-all duration-150"
          >
            Review SOPs
          </button>
        </div>
      </div>

      {/* Onboarding Wizard Setup Row */}
      {showOnboardingWizard && onUpdateTeam && onUpdatePlaybooks && (
        <OnboardingWizard
          teamMembers={teamMembers}
          playbooks={playbooks}
          onUpdateTeam={onUpdateTeam}
          onUpdatePlaybooks={onUpdatePlaybooks}
          onClose={() => {
            localStorage.setItem('sOS_onboarding_wizard_done', 'true');
            setShowOnboardingWizard(false);
          }}
        />
      )}

      {/* 2. Unified Overview Summary Bento Widget Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI Health Metric */}
        <div 
          onClick={() => onSetActiveTab('scorecard')}
          className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] p-5 rounded-2xl shadow-2xs hover:border-blue-500 hover:shadow-xs transition duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">Scorecard KPI Health</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-3">
            <h3 className="text-2xl font-extrabold text-[#1d1d1f] dark:text-white">{scorecardHealth}%</h3>
            <p className="text-[11px] text-[#86868b] mt-0.5 font-medium">On-Target Green metrics</p>
          </div>
          <div className="text-[9px] text-[#86868b] bg-[#f5f5f7] dark:bg-[#252526] py-1 px-2 rounded-md flex items-center justify-between border border-[#e8e8ed] dark:border-neutral-800">
            <span>{greenKPIs} of {totalKPIs} metrics</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>

        {/* Playbook Compliance Metric */}
        <div 
          onClick={() => onSetActiveTab('playbooks')}
          className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] p-5 rounded-2xl shadow-2xs hover:border-blue-500 hover:shadow-xs transition duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">SOP Step Verification</span>
            <FileCheck2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="my-3">
            <h3 className="text-2xl font-extrabold text-[#1d1d1f] dark:text-white">{stepCompletionRate}%</h3>
            <p className="text-[11px] text-[#86868b] mt-0.5 font-medium">Average task resolution rate</p>
          </div>
          <div className="text-[9px] text-[#86868b] bg-[#f5f5f7] dark:bg-[#252526] py-1 px-2 rounded-md flex items-center justify-between border border-[#e8e8ed] dark:border-neutral-800">
            <span>{completedSteps} / {totalSteps} verified stages</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          </div>
        </div>

        {/* Delegation / Founder Bottleneck Metric */}
        <div 
          onClick={() => onSetActiveTab('team')}
          className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] p-5 rounded-2xl shadow-2xs hover:border-blue-500 hover:shadow-xs transition duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">Founder Bottleneck</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="my-3">
            <h3 className="text-2xl font-extrabold text-[#1d1d1f] dark:text-white">
              {founderCabinCount} CABs Left
            </h3>
            <p className="text-[11px] text-[#86868b] mt-0.5 font-medium">{delegationRate}% delegation rate</p>
          </div>
          <div className="text-[9px] text-[#86868b] bg-[#f5f5f7] dark:bg-[#252526] py-1 px-2 rounded-md flex items-center justify-between border border-[#e8e8ed] dark:border-neutral-800">
            <span>{totalTeamMembers} active team staff</span>
            <span className={`w-1.5 h-1.5 rounded-full ${founderCabinCount === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </div>
        </div>

        {/* Sprints Progress Metric */}
        <div 
          onClick={() => onSetActiveTab('sprint')}
          className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] p-5 rounded-2xl shadow-2xs hover:border-blue-500 hover:shadow-xs transition duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider">Quarterly Sprints</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-3">
            <h3 className="text-2xl font-extrabold text-[#1d1d1f] dark:text-white">{sprintProgressPercent}%</h3>
            <p className="text-[11px] text-[#86868b] mt-0.5 font-medium">Initiatives completion rate</p>
          </div>
          <div className="text-[9px] text-[#86868b] bg-[#f5f5f7] dark:bg-[#252526] py-1 px-2 rounded-md flex items-center justify-between border border-[#e8e8ed] dark:border-neutral-800">
            <span>{accomplishedInitiatives} / {totalInitiatives} objectives met</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          </div>
        </div>

      </div>

      {/* 3. Operational Scorecard KPIs & Target Compliance (The primary data metrics panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Weekly Scorecard Actuals vs Targets Breakdowns */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Live Metric Scorecard & Monday Actuals
              </h2>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-bold uppercase font-mono">
                {scorecardHealth}% Operational Match
              </span>
            </div>
            <p className="text-xs text-[#86868b]">
              High-velocity weekly performance counters. All targets represent a baseline criteria.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#e8e8ed] dark:border-neutral-800 text-[#86868b] pb-2 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 font-medium">KPI Metric Name</th>
                  <th className="py-2.5 font-medium text-center">Category</th>
                  <th className="py-2.5 font-medium text-center">Last Actual</th>
                  <th className="py-2.5 font-medium text-center">Target Threshold</th>
                  <th className="py-2.5 font-medium text-end">Mitior State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 font-medium">
                {scorecard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#86868b]">
                      No weekly scorecards are currently recorded. Go to <strong>4. Scorecards</strong> to define yours!
                    </td>
                  </tr>
                ) : (
                  scorecard.map(m => {
                    // Extract the latest week actual (W4 if exists, else the last entry)
                    const actuals = m.weeklyActuals || {};
                    const weekKeys = Object.keys(actuals);
                    const lastWeekKey = weekKeys[weekKeys.length - 1] || 'W1';
                    const lastActual = actuals[lastWeekKey] || 'N/A';
                    
                    return (
                      <tr key={m.id} className="hover:bg-[#fbfbfd] dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-2.5 pr-2">
                          <p className="font-bold text-[#1d1d1f] dark:text-white">{m.name}</p>
                          <p className="text-[10px] text-[#86868b] font-normal truncate max-w-[200px]" title={m.metricSource}>Source: {m.metricSource}</p>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="capitalize text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded">
                            {m.category}
                          </span>
                        </td>
                        <td className="py-2.5 text-center font-mono font-bold text-[#1d1d1f] dark:text-white">
                          {m.unit === '$' ? '$' : ''}{Number(lastActual).toLocaleString()}{m.unit !== '$' && m.unit !== '#' ? ` ${m.unit}` : ''}
                        </td>
                        <td className="py-2.5 text-center font-mono font-bold text-[#86868b]">
                          {m.unit === '$' ? '$' : ''}{Number(m.target).toLocaleString()}{m.unit !== '$' && m.unit !== '#' ? ` ${m.unit}` : ''}
                        </td>
                        <td className="py-2.5 text-end">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wide ${
                            m.status === 'GREEN' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            m.status === 'YELLOW' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center bg-[#fbfbfd] dark:bg-[#252526] p-3 rounded-xl border border-[#e8e8ed] dark:border-neutral-800 text-[11px] text-[#86868b]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Need to append more operational data channels? 
            </span>
            <button 
              onClick={() => onSetActiveTab('scorecard')}
              className="font-bold text-[#1d1d1f] dark:text-white underline hover:text-blue-500"
            >
              Configure Grid Settings &rarr;
            </button>
          </div>
        </div>

        {/* KPI distribution pie chart on the right */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-purple-500" />
              Operational Scorecard Ratio
            </h2>
            <p className="text-xs text-[#86868b]">Ratio status mapping</p>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-44 h-44 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpiDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {kpiDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-[#1d1d1f] dark:text-white">{totalKPIs}</span>
                <span className="text-[9px] uppercase font-bold text-[#86868b] tracking-wider">Total Metrics</span>
              </div>
            </div>

            {/* Micro legends */}
            <div className="grid grid-cols-3 gap-4 w-full mt-6 text-center text-xs">
              <div className="space-y-0.5 bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
                <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{greenKPIs}</p>
                <p className="text-[9px] text-[#86868b] font-medium">GREEN</p>
              </div>
              <div className="space-y-0.5 bg-amber-500/5 p-2 rounded-xl border border-amber-500/10">
                <p className="font-bold text-amber-600 dark:text-amber-400 font-mono">{yellowKPIs}</p>
                <p className="text-[9px] text-[#86868b] font-medium">YELLOW</p>
              </div>
              <div className="space-y-0.5 bg-rose-500/5 p-2 rounded-xl border border-rose-500/10">
                <p className="font-bold text-rose-600 dark:text-rose-400 font-mono">{redKPIs}</p>
                <p className="text-[9px] text-[#86868b] font-medium">RED</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-bold text-neutral-800 dark:text-neutral-300">Operational Target Focus:</p>
            <p className="text-[11px] text-[#86868b] leading-relaxed">
              Maintain a steady state of green parameters. Yellow items highlight risk of failure; Red alarms require active project re-allocation.
            </p>
          </div>
        </div>

      </div>

      {/* 4. SOP/Playbook Step Completeness & Interactive Initiatives status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Recharts Bar chart for Playbook completeness */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
              <BarChart4 className="w-4 h-4 text-blue-500" />
              SOP Manual Completeness Spectrum
            </h2>
            <p className="text-xs text-[#86868b]">Verified procedural steps vs total required</p>
          </div>

          <div className="w-full h-56 mt-4">
            {playbookChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#86868b]">
                No active SOP manuals tracked. Create them inside the Playbooks tab!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={playbookChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-primary)" opacity={0.6} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#86868b', fontSize: 10 }} 
                    axisLine={{ stroke: 'var(--border-primary)' }} 
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{ fill: '#86868b', fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Bar 
                    dataKey="Completion %" 
                    fill="var(--bg-accent)" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2 border-t border-slate-100 dark:border-neutral-800 pt-3 text-xs flex justify-between items-center text-[#86868b]">
            <span>Mapped Operational Playbooks: <strong>{totalPlaybooks} active</strong></span>
            <span>Coupled to Pipelines: <strong>{linkedPlaybooks} nodes</strong></span>
          </div>
        </div>

        {/* Active Initiative Board list */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-500" />
                Active Quarterly Sprint Initiatives
              </h2>
              <span className="text-[10px] text-[#86868b] bg-neutral-100 dark:bg-neutral-800 px-2.5 py-0.5 rounded font-mono">
                {accomplishedInitiatives} / {totalInitiatives} Done
              </span>
            </div>
            <p className="text-xs text-[#86868b]">Active objectives tracked on high level status indicators</p>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 text-xs">
            {sprintPlan?.initiatives?.length === 0 ? (
              <div className="py-8 text-center text-[#86868b]">
                No sprint initiatives are currently set. Launch custom objectives inside the <strong>5. Initiative Rhythms</strong> tab!
              </div>
            ) : (
              sprintPlan?.initiatives?.map(init => (
                <div key={init.id} className="flex gap-3 p-2.5 bg-[#fbfbfd] dark:bg-[#252526] hover:bg-[#f5f5f7] dark:hover:bg-neutral-800/40 rounded-xl border border-[#e8e8ed] dark:border-neutral-800 transition">
                  <div className="mt-0.5 shrink-0">
                    {init.status === 'Accomplished' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : init.status === 'On-Track' ? (
                      <Clock className="w-4 h-4 text-blue-500" />
                    ) : init.status === 'Behind' ? (
                      <BadgeAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-[#8a8a8f]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="font-bold text-[#1d1d1f] dark:text-white truncate">{init.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[#86868b]">
                      <span>Due: <strong>{init.dueDate}</strong></span>
                      <span>&bull;</span>
                      <span>Owner: <strong className="text-[#1d1d1f] dark:text-white capitalize">{teamMembers.find(t => t.id === init.ownerId)?.name || init.ownerId}</strong></span>
                    </div>
                  </div>
                  <span className={`self-center text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    init.status === 'Accomplished' ? 'bg-emerald-500/10 text-emerald-600' :
                    init.status === 'On-Track' ? 'bg-blue-500/10 text-blue-600' :
                    init.status === 'Behind' ? 'bg-rose-500/10 text-rose-600' :
                    'bg-neutral-100 text-neutral-600 dark:bg-neutral-800'
                  }`}>
                    {init.status}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-neutral-800 pt-3 text-xs text-[#86868b] flex justify-between items-center">
            <span>Corporate Sprint Cry: <strong className="text-[#1d1d1f] dark:text-white italic">{sprintPlan?.rallyCry || 'None Set'}</strong></span>
            <button 
              onClick={() => onSetActiveTab('sprint')} 
              className="text-[#1d1d1f] dark:text-white font-extrabold hover:underline"
            >
              Quarterly Goals &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* 4.2 Mitior Operations Audit Trail & Activity Log */}
      <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 shadow-sm space-y-4 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e8e8ed] dark:border-neutral-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Mitior Enterprise Log & Audit Trail
            </h2>
            <p className="text-xs text-[#86868b]">Real-time offline tracking of major changes in playbooks, scorecard entries, and team roster updates</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-left justify-start">
            {/* Filter buttons */}
            <div className="inline-flex rounded-lg bg-neutral-100 dark:bg-neutral-800 p-0.5 text-[10.5px] font-semibold border border-neutral-200/40">
              {(['all', 'playbook', 'scorecard', 'team'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActivityFilter(f)}
                  className={`px-2.5 py-1 rounded-md transition select-none capitalize cursor-pointer ${
                    activityFilter === f
                      ? 'bg-white dark:bg-[#1d1d1f] text-[#1d1d1f] dark:text-white shadow-2xs font-extrabold'
                      : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                  }`}
                >
                  {f === 'all' ? 'All Logs' : f === 'playbook' ? 'SOP Manuals' : f === 'scorecard' ? 'KPI Grid' : 'Roster'}
                </button>
              ))}
            </div>

            {/* Clear activities trigger */}
            {onClearActivities && activities.length > 0 && (
              <button
                onClick={onClearActivities}
                className="bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700/60 transition text-neutral-500 hover:text-rose-500 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-neutral-200/50 dark:border-neutral-700 cursor-pointer"
              >
                Flush Trail
              </button>
            )}
          </div>
        </div>

        {/* List of activities */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin">
          {(() => {
            const filtered = activities.filter(act => {
              if (activityFilter === 'all') return true;
              return act.type === activityFilter;
            });

            if (filtered.length === 0) {
              return (
                <div className="py-12 border border-dashed border-[#e8e8ed] dark:border-neutral-800 rounded-2xl text-center space-y-2">
                  <Activity className="w-8 h-8 text-neutral-300 mx-auto animate-pulse" />
                  <p className="text-xs text-neutral-400 font-semibold text-center">No operational events cataloged yet.</p>
                  <p className="text-[10px] text-neutral-400 max-w-sm mx-auto leading-relaxed px-4 text-center">
                    Any subsequent changes you or your staff compile on Playbooks, Scorecard Cells, or Operator Rosters will populate this real-time Mitior feed partition.
                  </p>
                </div>
              );
            }

            return filtered.map(act => {
              // Custom styled helper based on activity category and action type
              let tagBg = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/40 dark:text-neutral-400';
              let badgeText = 'SYSTEM';
              let iconElement = <Activity className="w-3.5 h-3.5" />;

              if (act.type === 'playbook') {
                tagBg = 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
                badgeText = 'SOP';
                iconElement = <FileText className="w-3.5 h-3.5 text-blue-500" />;
              } else if (act.type === 'scorecard') {
                tagBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
                badgeText = 'KPI';
                iconElement = <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
              } else if (act.type === 'team') {
                tagBg = 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
                badgeText = 'ROSTER';
                iconElement = <Users className="w-3.5 h-3.5 text-purple-500" />;
              }

              // Compute human timeline duration representation
              let relativeTime = 'Just now';
              try {
                const diffMs = Date.now() - new Date(act.timestamp).getTime();
                const diffMin = Math.round(diffMs / 60000);
                if (diffMin === 0) relativeTime = 'Just now';
                else if (diffMin < 60) relativeTime = `${diffMin}m ago`;
                else {
                  const hrs = Math.round(diffMin / 60);
                  if (hrs < 24) relativeTime = `${hrs}h ago`;
                  else relativeTime = new Date(act.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                }
              } catch {
                relativeTime = 'Recently';
              }

              return (
                <div 
                  key={act.id} 
                  className="flex items-center justify-between gap-4 p-3 bg-[#fbfbfd] dark:bg-[#1f1f20] hover:bg-neutral-100/40 dark:hover:bg-neutral-800/30 rounded-xl border border-[#e8e8ed] dark:border-neutral-800/80 transition animate-fade-in text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${tagBg}`}>
                      {iconElement}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed break-keep text-left">
                        {act.message}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-left">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                          {badgeText}
                        </span>
                        <span className="text-[9px] text-neutral-400 font-mono">
                          {relativeTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md self-center tracking-wider shrink-0 ${
                    act.action === 'added' ? 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/10' :
                    act.action === 'completed' ? 'bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/10' :
                    act.action === 'deleted' ? 'bg-rose-500/5 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/10' :
                    'bg-amber-500/5 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/10'
                  }`}>
                    {act.action === 'added' ? 'Create' : act.action === 'completed' ? 'Done' : act.action === 'deleted' ? 'Purge' : 'Update'}
                  </span>
                </div>
              );
            });
          })()}
        </div>

        {/* Footer/Mitior State Counter */}
        <div className="flex items-center justify-between text-[11px] text-[#86868b] border-t border-neutral-100 dark:border-neutral-800 pt-3">
          <span>Active Log partition capacity: <strong className="text-neutral-700 dark:text-neutral-300">50 entries max</strong></span>
          <span className="font-mono text-[10px] text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 px-2 py-0.5 rounded">
            Filtered logs count: {(() => {
              const count = activities.filter(act => {
                if (activityFilter === 'all') return true;
                return act.type === activityFilter;
              }).length;
              return `${count} listed`;
            })()}
          </span>
        </div>
      </div>

      {/* 4.5 SOP Dependency Blockers & Operational Diagnostic Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Blocker/Dependency tracking widget */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-rose-500 animate-pulse" />
              SOP Blocked Checklist Tasks & Prerequisites
            </h2>
            <p className="text-xs text-[#86868b]">Checklist stages stalled due to unresolved prerequisite steps</p>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 text-xs my-2">
            {blockedSteps.length === 0 ? (
              <div className="py-12 text-center text-[#86868b] bg-emerald-50/5 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-950/40 border-dashed rounded-2xl p-4">
                <Unlock className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-xs text-emerald-800 dark:text-emerald-400">No active dependency bottlenecks!</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1">All SOP steps are clear to start immediately.</p>
              </div>
            ) : (
              blockedSteps.map((b, idx) => (
                <div 
                  key={idx} 
                  className="p-3 bg-rose-50/20 dark:bg-rose-950/25 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-rose-100 dark:border-rose-900 rounded-xl transition flex flex-col gap-2 cursor-pointer"
                  onClick={() => {
                    if (onSelectPlaybook) {
                      onSelectPlaybook(b.playbookId);
                      onSetActiveTab('playbooks');
                    }
                  }}
                  title="Click to resolve this blocker in Playbooks"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <span className="text-[9px] uppercase font-bold text-rose-600 dark:text-rose-400 font-mono tracking-wide block truncate">
                        {b.playbookTitle}
                      </span>
                      <p className="font-bold text-[#1d1d1f] dark:text-white mb-1 leading-tight break-words">
                        Locked Step: <span className="underline decoration-red-400">{b.stepText}</span>
                      </p>
                    </div>
                    <span className="p-1.5 bg-rose-100 dark:bg-rose-950/80 rounded text-rose-700 dark:text-rose-400 shrink-0">
                      <Lock className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 bg-neutral-100/60 dark:bg-neutral-900/40 p-2 rounded-lg border border-neutral-100/50 dark:border-neutral-800">
                    <span className="font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest text-[8px] mr-1 shrink-0">BLOCKER:</span>
                    <span className="truncate">{b.blockerText}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-neutral-800 pt-3 text-[11px] text-[#86868b] flex justify-between items-center">
            <span>Critical Blockages: <strong className={blockedSteps.length > 0 ? "text-rose-600 font-bold" : "text-emerald-600"}>{blockedSteps.length} bottleneck{blockedSteps.length === 1 ? '' : 's'}</strong></span>
            <button 
              onClick={() => onSetActiveTab('playbooks')} 
              className="text-[#1d1d1f] dark:text-white font-extrabold hover:underline hover:text-blue-500"
            >
              Configure dependencies &rarr;
            </button>
          </div>
        </div>

        {/* Operating Health Scan Diagnostic Widget */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Mitior Workstation Health Scanner
            </h2>
            <p className="text-xs text-[#86868b]">Run comprehensive diagnostic analysis of your enterprise operating structures</p>
          </div>

          <div className="bg-[#fbfbfd] dark:bg-[#1e1e20] rounded-xl border border-neutral-200/40 dark:border-neutral-800 p-4 shrink-0 flex flex-col justify-center min-h-[160px] relative">
            {diagScanActive ? (
              <div className="text-center py-6 space-y-3">
                <div className="h-6 w-6 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 animate-pulse font-semibold">Running deep pipeline scan...</p>
              </div>
            ) : diagScanResult ? (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pipeline Quality</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                      {diagScanResult.grade}
                    </span>
                  </div>
                  <div className="bg-slate-900 text-white dark:bg-white dark:text-[#1d1d1f] rounded-full px-3 py-1 text-xs font-extrabold font-mono">
                    {diagScanResult.score}/100
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 text-[11px] leading-relaxed max-h-24 overflow-y-auto">
                  {diagScanResult.advices.map((advice, index) => (
                    <div key={index} className="flex gap-1.5 text-slate-600 dark:text-slate-300">
                      <span className="text-blue-500 font-bold shrink-0 select-none">&bull;</span>
                      <span>{advice}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-1 opacity-70" />
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Diagnostic engine standby.</p>
                <button
                  onClick={triggerDiagnosticScan}
                  className="bg-[#1d1d1f] hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 rounded-xl text-[11px] font-bold transition inline-block cursor-pointer shadow-2xs"
                >
                  Execute Health Check Scan
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-neutral-800 pt-3 text-[11px] text-[#86868b] flex justify-between items-center">
            <span>SaaS Business Health Status</span>
            {diagScanResult && (
              <button 
                onClick={triggerDiagnosticScan}
                className="font-bold text-[#1d1d1f] dark:text-white underline hover:opacity-85 text-xs"
              >
                Scan again &rarr;
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 5. Clarity Compass Strategic Core & Enquiries Lead Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Clarity Compass Core Values & anchors */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-500" />
              Clarity Compass Strategic Pillars
            </h2>
            <p className="text-xs text-[#86868b]">Corporate anchors and core culture guardrails</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs py-2">
            <div className="p-3 bg-[#fbfbfd] dark:bg-[#252526] rounded-xl border border-slate-100 dark:border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Company Purpose Statement</span>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200 mt-1.5 leading-relaxed max-w-xs truncate" title={compass?.purposeStatement}>
                {compass?.purposeStatement || 'No Core Purpose defined yet.'}
              </p>
            </div>

            <div className="p-3 bg-[#fbfbfd] dark:bg-[#252526] rounded-xl border border-slate-100 dark:border-neutral-800">
              <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Three Year Target</span>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200 mt-1.5 leading-relaxed max-w-xs truncate" title={compass?.threeYearTarget}>
                {compass?.threeYearTarget || 'No long term target defined yet.'}
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 dark:border-neutral-800 pt-3 text-xs text-[#86868b]">
            <p className="font-bold text-[#1d1d1f] dark:text-white">Culture Values Alignment:</p>
            <div className="flex flex-wrap gap-1.5">
              {compass?.coreValues?.length === 0 ? (
                <span className="text-neutral-400">None declared. Enter core values inside tab 6.</span>
              ) : (
                compass?.coreValues?.slice(0, 3).map((val, idx) => (
                  <span key={idx} className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded text-[10px] font-bold">
                    {val.split(' ')[0]} {val.split(' ')[1] || ''}
                  </span>
                ))
              )}
              {compass?.coreValues && compass.coreValues.length > 3 && (
                <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded text-[10px]">
                  +{compass.coreValues.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Lead Enquiries / Pipeline stats inbox */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-[#1d1d1f] dark:text-white flex items-center gap-1.5">
              <Inbox className="w-4 h-4 text-blue-500" />
              SaaS & Client Enquiries Lead Pipeline
            </h2>
            <p className="text-xs text-[#86868b]">Inbox statistics & new inbound contacts</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-blue-500/5 rounded-xl border border-blue-500/10">
              <p className="font-bold text-blue-600 dark:text-blue-400 text-lg font-mono">{newEnquiriesCount}</p>
              <p className="text-[9px] text-[#86868b] font-medium">NEW LEADS</p>
            </div>
            <div className="p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/10">
              <p className="font-bold text-amber-600 dark:text-amber-400 text-lg font-mono">{pendingEnquiriesCount}</p>
              <p className="text-[9px] text-[#86868b] font-medium">IN PROGRESS</p>
            </div>
            <div className="p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg font-mono">{addressedEnquiriesCount}</p>
              <p className="text-[9px] text-[#86868b] font-medium">RESOLVED</p>
            </div>
          </div>

          {/* Stream of enquiries */}
          <div className="space-y-2 text-xs">
            <p className="font-bold text-neutral-800 dark:text-neutral-300">Recent Customer Inbound:</p>
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {enquiries.length === 0 ? (
                <div className="py-2 text-[#86868b] text-center text-[10px]">No sales/licensing leads in inbox.</div>
              ) : (
                enquiries.slice(0, 3).map(e => (
                  <div key={e.id} className="p-1.5 bg-[#fbfbfd] dark:bg-[#252526] hover:bg-neutral-100 rounded border border-slate-150 flex justify-between items-center">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-[#1d1d1f] dark:text-white truncate text-[10px]">{e.senderName}</p>
                      <p className="text-[9px] text-[#86868b] truncate">{e.subject}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                      e.status === 'New' ? 'bg-blue-100 text-blue-800' :
                      e.status === 'In-Progress' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {e.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {!showOnboardingWizard && (
        <div className="flex justify-center items-center pt-2 pb-2">
          <button
            onClick={() => {
              localStorage.removeItem('sOS_onboarding_wizard_done');
              setShowOnboardingWizard(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer bg-indigo-500/5 px-4 py-2 rounded-2xl border border-indigo-500/10 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Video Onboarding Setup</span>
          </button>
        </div>
      )}

    </div>
  );
}
