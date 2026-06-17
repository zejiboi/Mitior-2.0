import { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  Layers, 
  ListTodo,
  Sparkles,
  History,
  TrendingUp,
  Award
} from 'lucide-react';
import { SprintPlan, SprintInitiative, TeamMember, STANDARD_MEETING_AGENDAS } from '../types';

// Helper function to extract luxury color palette based on completion percentage (Red to Gold to Emerald Green)
const getLuxuryColorPalette = (percentage: number) => {
  if (percentage < 35) {
    return {
      stroke: '#b91c1c', // Burgundy Red / Crimson
      bg: 'bg-rose-50/75 dark:bg-rose-950/25',
      border: 'border-rose-100 dark:border-rose-950/30 text-rose-950 dark:text-rose-200',
      textAccent: 'text-rose-700',
      badge: 'bg-rose-100 text-rose-800'
    };
  } else if (percentage < 70) {
    return {
      stroke: '#d97706', // Burnished Bronze / Amber gold
      bg: 'bg-amber-50/75 dark:bg-amber-950/25',
      border: 'border-amber-100 dark:border-amber-950/30 text-amber-950 dark:text-amber-200',
      textAccent: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800'
    };
  } else {
    return {
      stroke: '#059669', // Imperial Jade / Emerald Sage
      bg: 'bg-emerald-50/75 dark:bg-emerald-950/25',
      border: 'border-emerald-100 dark:border-emerald-950/30 text-emerald-950 dark:text-emerald-200',
      textAccent: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800'
    };
  }
};

const CircularProgress = ({ value, max }: { value: number; max: number }) => {
  const percentage = Math.min(Math.max(max > 0 ? (value / max) * 100 : 0, 0), 100);
  const strokeDashoffset = 100 - percentage;
  const palette = getLuxuryColorPalette(percentage);

  return (
    <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-neutral-200 dark:text-neutral-800"
          strokeWidth="3.5"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          className="transition-all duration-300"
          strokeWidth="3.5"
          strokeDasharray="100, 100"
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke={palette.stroke}
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <span className="absolute text-[9px] font-mono font-bold text-neutral-800 dark:text-neutral-250">
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

interface SprintCanvasViewProps {
  sprintPlan: SprintPlan;
  teamMembers: TeamMember[];
  onUpdateSprint: (updated: SprintPlan) => void;
}

export default function SprintCanvasView({
  sprintPlan,
  teamMembers,
  onUpdateSprint,
}: SprintCanvasViewProps) {
  const [activePlanTab, setActivePlanTab] = useState<'blueprint' | 'agenda'>('blueprint');

  // Inputable actual values state connecting to Progress Bars
  const [sprintProgress, setSprintProgress] = useState<{ [key: string]: number }>(() => {
    const saved = localStorage.getItem('s_sprint_progress_actuals');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      good: 320000,
      better: 410000,
      best: 450000,
      month1: 110000,
      month2: 120000,
      month3: 130000,
      unit: 75
    };
  });

  const updateProgressValue = (key: string, val: number) => {
    const next = { ...sprintProgress, [key]: val };
    setSprintProgress(next);
    localStorage.setItem('s_sprint_progress_actuals', JSON.stringify(next));
  };
  
  // Meeting Agendas log state
  const [activeAgendaId, setActiveAgendaId] = useState<string>('ma-1');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [recentNotesLog, setRecentNotesLog] = useState<Array<{ date: string; title: string; content: string }>>([
    { date: "2026-06-01", title: "90-Min Pulse Check", content: "Completed Gross Stripe Collections review. Video creative script modifications locked down." }
  ]);

  // Initiative Creator inline states
  const [newInitName, setNewInitName] = useState('');
  const [newInitDue, setNewInitDue] = useState('09/30');
  const [newInitStatus, setNewInitStatus] = useState<SprintInitiative['status']>('Not Started');
  const [newInitPillar, setNewInitPillar] = useState('STRATEGIC PILLAR #1');
  const [newInitOwner, setNewInitOwner] = useState(teamMembers[0]?.id || 'tm-owner');
  const [newInitTeam, setNewInitTeam] = useState('Product');

  const activeAgenda = STANDARD_MEETING_AGENDAS.find(a => a.id === activeAgendaId) || STANDARD_MEETING_AGENDAS[0];

  const handleUpdateSprintField = (field: keyof SprintPlan, value: any) => {
    onUpdateSprint({
      ...sprintPlan,
      [field]: value
    });
  };

  const handleUpdatePillar = (index: number, newTitle: string, newDesc: string) => {
    const updatedPillars = sprintPlan.strategicPillars.map((p, idx) => {
      if (idx === index) return { title: newTitle, desc: newDesc };
      return p;
    });
    handleUpdateSprintField('strategicPillars', updatedPillars);
  };

  const handleAddNewPillar = () => {
    const num = sprintPlan.strategicPillars.length + 1;
    const nextPillars = [
      ...sprintPlan.strategicPillars,
      { title: `STRATEGIC PILLAR #${num}`, desc: "Enter focus objective or key metric target..." }
    ];
    handleUpdateSprintField('strategicPillars', nextPillars);
  };

  const handleAddInitiative = () => {
    if (!newInitName.trim()) return;

    const newInit: SprintInitiative = {
      id: `i-custom-${Date.now()}`,
      name: newInitName,
      dueDate: newInitDue,
      status: newInitStatus,
      ownerId: newInitOwner,
      stakeholders: "Full Team, Ry",
      team: newInitTeam,
      pillar: newInitPillar
    };

    onUpdateSprint({
      ...sprintPlan,
      initiatives: [...sprintPlan.initiatives, newInit]
    });

    setNewInitName('');
  };

  const handleDeleteInitiative = (initId: string) => {
    const updated = sprintPlan.initiatives.filter(i => i.id !== initId);
    onUpdateSprint({
      ...sprintPlan,
      initiatives: updated
    });
  };

  const handleUpdateInitiativeField = (initId: string, field: keyof SprintInitiative, value: any) => {
    const updated = sprintPlan.initiatives.map(i => {
      if (i.id === initId) return { ...i, [field]: value };
      return i;
    });
    onUpdateSprint({
      ...sprintPlan,
      initiatives: updated
    });
  };

  const handleSaveNotes = () => {
    if (!sessionNotes.trim()) return;
    const newLogItem = {
      date: new Date().toISOString().slice(0, 10),
      title: activeAgenda.name,
      content: sessionNotes.trim()
    };
    setRecentNotesLog([newLogItem, ...recentNotesLog]);
    setSessionNotes('');
  };

  // Helper values for goal dynamic classes
  const parseVal = (strVal: string) => parseFloat((strVal || '1').replace(/[^0-9]/g, '')) || 1;

  const goodPct = (sprintProgress.good / parseVal(sprintPlan.revenueGoalGood)) * 100;
  const betterPct = (sprintProgress.better / parseVal(sprintPlan.revenueGoalBetter)) * 100;
  const bestPct = (sprintProgress.best / parseVal(sprintPlan.revenueGoalBest)) * 100;
  const unitPct = (sprintProgress.unit / parseVal(sprintPlan.unitGoalValue)) * 100;
  const m1Pct = (sprintProgress.month1 / parseVal(sprintPlan.month1Goal)) * 100;
  const m2Pct = (sprintProgress.month2 / parseVal(sprintPlan.month2Goal)) * 100;
  const m3Pct = (sprintProgress.month3 / parseVal(sprintPlan.month3Goal)) * 100;

  const goodPal = getLuxuryColorPalette(goodPct);
  const betterPal = getLuxuryColorPalette(betterPct);
  const bestPal = getLuxuryColorPalette(bestPct);
  const unitPal = getLuxuryColorPalette(unitPct);
  const m1Pal = getLuxuryColorPalette(m1Pct);
  const m2Pal = getLuxuryColorPalette(m2Pct);
  const m3Pal = getLuxuryColorPalette(m3Pct);

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      
      {/* Intro tab slider header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-[#e8e8ed] p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-[#1d1d1f]">
            Sprints & alignment pulse
          </h2>
          <p className="text-[#86868b] text-xs max-w-xl">
            SOPs succeed when they live inside daily rhythms. Shift long business goals into ninety-day sprints, run with ninety-minute tactical meeting rules.
          </p>
        </div>

        {/* Sprint Tab Selection switcher */}
        <div className="inline-flex rounded-full bg-[#f5f5f7] p-1 border border-[#e8e8ed]">
          <button
            onClick={() => setActivePlanTab('blueprint')}
            className={`px-5 py-2 text-xs font-semibold rounded-full transition cursor-pointer ${
              activePlanTab === 'blueprint' 
                ? 'bg-[#1d1d1f] text-white shadow-xs' 
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Quarterly Sprint Canvas
          </button>
          <button
            onClick={() => setActivePlanTab('agenda')}
            className={`px-5 py-2 text-xs font-semibold rounded-full transition cursor-pointer ${
              activePlanTab === 'agenda' 
                ? 'bg-[#1d1d1f] text-white shadow-xs' 
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            SOP Agenda Scheduler
          </button>
        </div>
      </div>

      {activePlanTab === 'blueprint' ? (
        <div className="space-y-8 animate-fade-in">
          
          {/* A. Strategic Pillars Setup */}
          <div className="bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-[#f5f5f7] pb-3">
              <h3 className="font-semibold text-[#1d1d1f] text-sm uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#8a8a8f]" />
                Strategic pillars
              </h3>
              <button
                onClick={handleAddNewPillar}
                className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Strategic Pillar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sprintPlan.strategicPillars.map((p, idx) => (
                <div key={idx} className="bg-[#fbfbfd] hover:bg-white border border-[#e8e8ed] rounded-xl p-5 flex flex-col justify-between space-y-3 text-xs transition shadow-2xs">
                  <div className="space-y-2">
                    <span className="font-semibold text-[#86868b] text-[9px] uppercase tracking-wider block font-mono">PILLAR #{idx + 1}</span>
                    <input
                      type="text"
                      value={p.title}
                      onChange={(e) => handleUpdatePillar(idx, e.target.value, p.desc)}
                      className="bg-transparent font-bold text-[#1d1d1f] outline-none w-full border-b border-transparent focus:border-[#e8e8ed]"
                    />
                    <textarea
                      value={p.desc}
                      onChange={(e) => handleUpdatePillar(idx, p.title, e.target.value)}
                      rows={3}
                      className="bg-transparent text-neutral-800 dark:text-neutral-200 outline-none w-full border-none p-0 resize-none leading-relaxed text-xs font-semibold"
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        const nextPillars = sprintPlan.strategicPillars.filter((_, i) => i !== idx);
                        handleUpdateSprintField('strategicPillars', nextPillars);
                      }}
                      className="text-[#86868b] hover:text-red-500 rounded p-1 transition cursor-pointer"
                      title="Remove Strategic Pillar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B. Main Financial Target Dials - BEAUTIFULLY COLOUR-CODED & LUXURY GOAL GRADIENTS! */}
          <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-[#f5f5f7] dark:border-[#2d2d2f] pb-4 flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-1.5 w-72">
                <input
                  type="text"
                  value={sprintPlan.quarter}
                  onChange={(e) => handleUpdateSprintField('quarter', e.target.value)}
                  className="text-base font-bold text-neutral-900 dark:text-white border-b border-dashed outline-none w-full border-[#e8e8ed] dark:border-neutral-700 focus:border-black dark:focus:border-white"
                />
                <p className="text-xs text-[#86868b] dark:text-[#8e8e93]">
                  Update active 90-day parameters.
                </p>
              </div>

              {/* Rallying Cry Theme Banner input */}
              <div className="bg-[#f5f5f7] dark:bg-[#252526] border border-[#e8e8ed] dark:border-neutral-800 text-neutral-900 dark:text-white p-4 rounded-xl flex items-center gap-3 flex-1 max-w-xl shadow-xs">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="space-y-0.5 w-full text-xs text-left">
                  <span className="font-semibold text-neutral-500 dark:text-neutral-400 text-[10px] uppercase font-mono tracking-wider">Rallying Cry / Theme</span>
                  <input
                    type="text"
                    value={sprintPlan.rallyCry}
                    onChange={(e) => handleUpdateSprintField('rallyCry', e.target.value)}
                    className="bg-transparent font-bold text-xs text-neutral-900 dark:text-white w-full outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Good / Better / Best Financial Tiers with circular progress & actuals inputs with luxury color states */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* GOOD TARGET */}
              <div className={`border p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all duration-300 shadow-[#00000003] shadow-xs ${goodPal.bg} ${goodPal.border}`}>
                <div className="space-y-2 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider block font-mono text-neutral-800 dark:text-neutral-100">GOOD REVENUE TARGET</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-600 dark:text-neutral-300 text-base font-bold">$</span>
                    <input
                      type="text"
                      value={sprintPlan.revenueGoalGood}
                      onChange={(e) => handleUpdateSprintField('revenueGoalGood', e.target.value)}
                      className="text-lg font-extrabold text-neutral-900 dark:text-white bg-transparent outline-none w-full border-b border-dashed border-neutral-350 dark:border-neutral-700 focus:border-black dark:focus:border-white"
                    />
                  </div>
                  <div className="pt-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300 block">Actual Invoiced Progress ($)</label>
                    <input
                      type="number"
                      value={sprintProgress.good}
                      onChange={(e) => updateProgressValue('good', parseFloat(e.target.value) || 0)}
                      className="bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-neutral-800 text-neutral-900 dark:text-white text-xs font-semibold rounded-lg px-2 py-1.5 w-full mt-1 outline-none focus:border-neutral-800 dark:focus:border-neutral-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-black/5 dark:border-white/5 mt-2">
                  <CircularProgress value={sprintProgress.good} max={parseVal(sprintPlan.revenueGoalGood)} />
                  <p className="text-[10px] text-neutral-850 dark:text-neutral-105 font-bold leading-tight">Base safe business survival target.</p>
                </div>
              </div>

              {/* BETTER TARGET */}
              <div className={`border p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all duration-300 shadow-[#00000003] shadow-xs ${betterPal.bg} ${betterPal.border}`}>
                <div className="space-y-2 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider block font-mono text-neutral-800 dark:text-neutral-100">BETTER REVENUE TARGET</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-600 dark:text-neutral-300 text-base font-bold">$</span>
                    <input
                      type="text"
                      value={sprintPlan.revenueGoalBetter}
                      onChange={(e) => handleUpdateSprintField('revenueGoalBetter', e.target.value)}
                      className="text-lg font-extrabold text-neutral-900 dark:text-white bg-transparent outline-none w-full border-b border-dashed border-neutral-350 dark:border-neutral-700 focus:border-black dark:focus:border-white font-sans"
                    />
                  </div>
                  <div className="pt-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300 block">Actual Invoiced Progress ($)</label>
                    <input
                      type="number"
                      value={sprintProgress.better}
                      onChange={(e) => updateProgressValue('better', parseFloat(e.target.value) || 0)}
                      className="bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-neutral-800 text-neutral-900 dark:text-white text-xs font-semibold rounded-lg px-2 py-1.5 w-full mt-1 outline-none focus:border-neutral-800 dark:focus:border-neutral-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-black/5 dark:border-white/5 mt-2">
                  <CircularProgress value={sprintProgress.better} max={parseVal(sprintPlan.revenueGoalBetter)} />
                  <p className="text-[10px] text-neutral-850 dark:text-neutral-105 font-bold leading-tight">Desired business operational roadmap target.</p>
                </div>
              </div>

              {/* BEST TARGET */}
              <div className={`border p-5 rounded-2xl flex flex-col justify-between space-y-4 transition-all duration-300 shadow-[#00000003] shadow-xs ${bestPal.bg} ${bestPal.border}`}>
                <div className="space-y-2 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider block font-mono text-neutral-800 dark:text-neutral-100 font-bold">BEST REVENUE REACH TARGET</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-600 dark:text-neutral-300 text-base font-bold">$</span>
                    <input
                      type="text"
                      value={sprintPlan.revenueGoalBest}
                      onChange={(e) => handleUpdateSprintField('revenueGoalBest', e.target.value)}
                      className="text-lg font-extrabold text-neutral-900 dark:text-white bg-transparent outline-none w-full border-b border-dashed border-neutral-350 dark:border-neutral-700 focus:border-black dark:focus:border-white font-sans"
                    />
                  </div>
                  <div className="pt-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-300 block">Actual Invoiced Progress ($)</label>
                    <input
                      type="number"
                      value={sprintProgress.best}
                      onChange={(e) => updateProgressValue('best', parseFloat(e.target.value) || 0)}
                      className="bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-neutral-800 text-neutral-900 dark:text-white text-xs font-semibold rounded-lg px-2 py-1.5 w-full mt-1 outline-none focus:border-neutral-800 dark:focus:border-neutral-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-black/5 dark:border-white/5 mt-2">
                  <CircularProgress value={sprintProgress.best} max={parseVal(sprintPlan.revenueGoalBest)} />
                  <p className="text-[10px] text-neutral-855 dark:text-neutral-100 font-bold leading-tight font-sans">Aspiration goal. Dynamic stretch boundary.</p>
                </div>
              </div>

            </div>

            {/* Monthly and Unit progress targets block */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2 text-xs">
              
              {/* Unit Goal target */}
              <div className={`border p-4.5 rounded-xl space-y-3 transition-all duration-300 shadow-2xs ${unitPal.bg} ${unitPal.border}`}>
                <div className="text-left animate-fade-in">
                  <span className="font-bold block text-[9.5px] uppercase tracking-wider font-mono text-neutral-800 dark:text-neutral-100">Unit Goal Target</span>
                  <input
                    type="text"
                    value={sprintPlan.unitGoalName}
                    onChange={(e) => handleUpdateSprintField('unitGoalName', e.target.value)}
                    className="bg-transparent font-bold outline-none w-full text-neutral-900 dark:text-white border-b border-dashed border-neutral-350 dark:border-neutral-700 focus:border-black dark:focus:border-white"
                  />
                  <input
                    type="text"
                    value={sprintPlan.unitGoalValue}
                    onChange={(e) => handleUpdateSprintField('unitGoalValue', e.target.value)}
                    className="bg-transparent font-extrabold text-base text-neutral-900 dark:text-white outline-none w-full mt-1"
                  />
                  <div className="mt-1.5">
                    <label className="text-[8px] font-bold uppercase tracking-wider text-neutral-850 dark:text-neutral-200">Current Actual Units</label>
                    <input
                      type="number"
                      value={sprintProgress.unit}
                      onChange={(e) => updateProgressValue('unit', parseFloat(e.target.value) || 0)}
                      className="bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-neutral-800 text-neutral-900 dark:text-white text-[11px] font-semibold rounded-md px-1.5 py-1 w-full mt-0.5 outline-none font-sans text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <CircularProgress value={sprintProgress.unit} max={parseVal(sprintPlan.unitGoalValue)} />
                  <span className="text-[10px] text-neutral-800 dark:text-neutral-200 font-bold">Unit quota milestone progress</span>
                </div>
              </div>

              {/* Month 1 target */}
              <div className={`border p-4.5 rounded-xl space-y-3 transition-all duration-300 shadow-2xs ${m1Pal.bg} ${m1Pal.border}`}>
                <div className="text-left">
                  <span className="font-bold block text-[9.5px] uppercase tracking-wider font-mono text-neutral-800 dark:text-neutral-100">Month 1 Target</span>
                  <input
                    type="text"
                    value={sprintPlan.month1Name}
                    onChange={(e) => handleUpdateSprintField('month1Name', e.target.value)}
                    className="bg-transparent font-bold outline-none w-full text-neutral-900 dark:text-white border-b border-dashed border-neutral-350 dark:border-neutral-700 focus:border-black dark:focus:border-white font-sans"
                  />
                  <div className="flex items-center gap-1 font-bold text-base text-neutral-900 dark:text-white mt-1">
                    <span>$</span>
                    <input
                      type="text"
                      value={sprintPlan.month1Goal}
                      onChange={(e) => handleUpdateSprintField('month1Goal', e.target.value)}
                      className="bg-transparent outline-none w-full font-extrabold text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div className="mt-1.5">
                    <label className="text-[8px] font-bold uppercase tracking-wider text-neutral-850 dark:text-neutral-200">Current Actual</label>
                    <input
                      type="number"
                      value={sprintProgress.month1}
                      onChange={(e) => updateProgressValue('month1', parseFloat(e.target.value) || 0)}
                      className="bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-neutral-800 text-[11px] font-bold text-neutral-900 dark:text-white rounded-md px-1.5 py-1 w-full mt-0.5 outline-none font-sans text-xs shadow-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <CircularProgress value={sprintProgress.month1} max={parseVal(sprintPlan.month1Goal)} />
                  <span className="text-[10px] text-neutral-800 dark:text-neutral-200 font-bold font-sans">Period progress tally</span>
                </div>
              </div>

              {/* Month 2 target */}
              <div className={`border p-4.5 rounded-xl space-y-3 transition-all duration-300 shadow-2xs ${m2Pal.bg} ${m2Pal.border}`}>
                <div className="text-left">
                  <span className="font-bold block text-[9.5px] uppercase tracking-wider font-mono text-neutral-800 dark:text-neutral-100">Month 2 Target</span>
                  <input
                    type="text"
                    value={sprintPlan.month2Name}
                    onChange={(e) => handleUpdateSprintField('month2Name', e.target.value)}
                    className="bg-transparent font-bold outline-none w-full text-neutral-900 dark:text-white border-b border-dashed border-neutral-350 dark:border-neutral-700 focus:border-black dark:focus:border-white font-sans"
                  />
                  <div className="flex items-center gap-1 font-bold text-base text-neutral-900 dark:text-white mt-1">
                    <span>$</span>
                    <input
                      type="text"
                      value={sprintPlan.month2Goal}
                      onChange={(e) => handleUpdateSprintField('month2Goal', e.target.value)}
                      className="bg-transparent outline-none w-full font-extrabold text-neutral-900 dark:text-white"
                    />
                  </div>
                  <div className="mt-1.5">
                    <label className="text-[8px] font-bold uppercase tracking-wider text-neutral-855 dark:text-neutral-200">Current Actual</label>
                    <input
                      type="number"
                      value={sprintProgress.month2}
                      onChange={(e) => updateProgressValue('month2', parseFloat(e.target.value) || 0)}
                      className="bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-neutral-800 text-[11px] font-bold text-neutral-900 dark:text-white rounded-md px-1.5 py-1 w-full mt-0.5 outline-none font-sans text-xs shadow-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <CircularProgress value={sprintProgress.month2} max={parseVal(sprintPlan.month2Goal)} />
                  <span className="text-[10px] text-neutral-800 dark:text-neutral-200 font-bold font-sans">Period progress tally</span>
                </div>
              </div>

              {/* Month 3 target */}
              <div className={`border p-4.5 rounded-xl space-y-3 transition-all duration-300 shadow-2xs ${m3Pal.bg} ${m3Pal.border}`}>
                <div className="text-left">
                  <span className="font-bold block text-[9.5px] uppercase tracking-wider font-mono text-neutral-800 dark:text-neutral-100">Month 3 Target</span>
                  <input
                    type="text"
                    value={sprintPlan.month3Name}
                    onChange={(e) => handleUpdateSprintField('month3Name', e.target.value)}
                    className="bg-transparent font-bold outline-none w-full text-neutral-900 dark:text-white border-b border-dashed border-neutral-350 dark:border-neutral-700 focus:border-black dark:focus:border-white font-sans"
                  />
                  <div className="flex items-center gap-1 font-bold text-base text-neutral-900 dark:text-white mt-1">
                    <span>$</span>
                    <input
                      type="text"
                      value={sprintPlan.month3Goal}
                      onChange={(e) => handleUpdateSprintField('month3Goal', e.target.value)}
                      className="bg-transparent outline-none w-full text-neutral-900 dark:text-white font-extrabold"
                    />
                  </div>
                  <div className="mt-1.5">
                    <label className="text-[8px] font-bold uppercase tracking-wider text-neutral-855 dark:text-neutral-200">Current Actual</label>
                    <input
                      type="number"
                      value={sprintProgress.month3}
                      onChange={(e) => updateProgressValue('month3', parseFloat(e.target.value) || 0)}
                      className="bg-white dark:bg-[#151516] border border-[#e8e8ed] dark:border-neutral-800 text-[11px] font-bold text-neutral-900 dark:text-white rounded-md px-1.5 py-1 w-full mt-0.5 outline-none font-sans text-xs shadow-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                  <CircularProgress value={sprintProgress.month3} max={parseVal(sprintPlan.month3Goal)} />
                  <span className="text-[10px] text-neutral-800 dark:text-neutral-200 font-bold font-sans">Period progress tally</span>
                </div>
              </div>

            </div>
          </div>

          {/* C. Quick Initiative Creator Form */}
          <div className="bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm max-w-xl space-y-4">
            <h3 className="font-semibold text-[#1d1d1f] flex items-center gap-1.5 text-sm uppercase tracking-wider">
              <ListTodo className="w-4 h-4 text-[#8a8a8f]" />
              Schedule new sprint task initiative
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Init Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[#86868b] block font-medium">Initiative Milestone Title</label>
                <input
                  type="text"
                  placeholder="e.g. Expand premium local business training"
                  value={newInitName}
                  onChange={(e) => setNewInitName(e.target.value)}
                  className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] outline-none p-2.5 rounded-xl w-full text-xs font-semibold text-[#1d1d1f]"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-[#86868b] block font-medium">Due Date</label>
                <input
                  type="text"
                  placeholder="e.g. 09/30"
                  value={newInitDue}
                  onChange={(e) => setNewInitDue(e.target.value)}
                  className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] outline-none p-2.5 rounded-xl w-full text-xs font-semibold text-[#1d1d1f]"
                />
              </div>

              {/* Owner */}
              <div className="space-y-1.5">
                <label className="text-[#86868b] block font-medium">Responsible Owner</label>
                <select
                  value={newInitOwner}
                  onChange={(e) => setNewInitOwner(e.target.value)}
                  className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] outline-none p-2.5 rounded-xl w-full cursor-pointer text-xs font-semibold text-neutral-800"
                >
                  {teamMembers.map(tm => (
                    <option key={tm.id} value={tm.id}>{tm.name}</option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-[#86868b] block font-medium">Department Group</label>
                <input
                  type="text"
                  value={newInitTeam}
                  onChange={(e) => setNewInitTeam(e.target.value)}
                  className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] outline-none p-2.5 rounded-xl w-full text-xs font-semibold text-[#1d1d1f]"
                />
              </div>

              {/* Pillar Alignment */}
              <div className="space-y-1.5">
                <label className="text-[#86868b] block font-medium">Strategic Pillar Link</label>
                <select
                  value={newInitPillar}
                  onChange={(e) => setNewInitPillar(e.target.value)}
                  className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] outline-none p-2.5 rounded-xl w-full cursor-pointer text-xs font-semibold text-neutral-800"
                >
                  {sprintPlan.strategicPillars.map((p, pIdx) => (
                    <option key={pIdx} value={p.title}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleAddInitiative}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-xl px-4 py-2.5 text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Save Initiative to Checklist
            </button>
          </div>

          {/* D. Active Sprints Initiatives Table checklist */}
          <div className="bg-white border border-[#e8e8ed] rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-[#f5f5f7] bg-[#fbfbfd] px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-semibold text-[#1d1d1f] text-sm">
                  Active sprint initiatives checklist
                </h3>
                <p className="text-[#86868b] text-[11px] mt-0.5">
                  Access entire company strategic deliverables with direct edit permission nodes.
                </p>
              </div>
              <span className="text-[10px] font-mono bg-neutral-900 text-white border border-neutral-800 px-2.5 py-1 rounded-full font-bold">
                ADMIN CONSOLE ACTIVE
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#fbfbfd] border-b border-[#e8e8ed] text-[#86868b] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-6">Goal / Task Initiative</th>
                    <th className="py-3 px-3 text-center">Due Date</th>
                    <th className="py-3 px-4 text-center">Sprint Status</th>
                    <th className="py-3 px-5">Strategic Pillar</th>
                    <th className="py-3 px-5">Responsible Owner</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f7] text-xs text-[#1d1d1f]">
                  {sprintPlan.initiatives.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#86868b]">No active initiatives mapped yet in this sprint cycle.</td>
                    </tr>
                  ) : (
                    sprintPlan.initiatives.map(ini => (
                      <tr key={ini.id} className="hover:bg-[#fbfbfd] transition">
                        
                        {/* Title */}
                        <td className="py-3.5 px-6 font-semibold">
                          {ini.name}
                        </td>

                        {/* Due Date */}
                        <td className="py-3.5 px-3 text-center font-mono text-[#86868b]">
                          <input
                            type="text"
                            value={ini.dueDate}
                            onChange={(e) => handleUpdateInitiativeField(ini.id, 'dueDate', e.target.value)}
                            className="bg-transparent font-mono text-center outline-none w-14 border-b border-transparent focus:border-slate-200"
                          />
                        </td>

                        {/* Status dropdown */}
                        <td className="py-3.5 px-4 text-center">
                          <select
                            value={ini.status}
                            onChange={(e) => handleUpdateInitiativeField(ini.id, 'status', e.target.value as any)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold border outline-none cursor-pointer tracking-tight uppercase ${
                              ini.status === 'Accomplished' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                              ini.status === 'On-Track' ? 'bg-blue-50 text-blue-800 border-blue-100' :
                              ini.status === 'Behind' ? 'bg-red-50 text-red-800 border-red-100' :
                              'bg-white text-[#1d1d1f] border-[#e8e8ed]'
                            }`}
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="On-Track">On-Track</option>
                            <option value="Accomplished">Completed</option>
                            <option value="Behind">Behind</option>
                            <option value="Reprioritized">Reschedule</option>
                          </select>
                        </td>

                        {/* Align strategic pillar */}
                        <td className="py-3.5 px-5 text-[#86868b]">
                          <select
                            value={ini.pillar}
                            onChange={(e) => handleUpdateInitiativeField(ini.id, 'pillar', e.target.value)}
                            className="bg-transparent border-none outline-none cursor-pointer text-xs font-semibold"
                          >
                            {sprintPlan.strategicPillars.map((p, pIdx) => (
                              <option key={pIdx} value={p.title}>{p.title}</option>
                            ))}
                          </select>
                        </td>

                        {/* Owner Selection dropdown */}
                        <td className="py-3.5 px-5">
                          <select
                            value={ini.ownerId}
                            onChange={(e) => handleUpdateInitiativeField(ini.id, 'ownerId', e.target.value)}
                            className="bg-white border border-[#e8e8ed] text-xs rounded-lg p-1.5 outline-none font-sans cursor-pointer max-w-[125px]"
                          >
                            {teamMembers.map(tm => (
                              <option key={tm.id} value={tm.id}>{tm.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* Department/Team */}
                        <td className="py-3.5 px-4 text-[#86868b]">
                          <input
                            type="text"
                            value={ini.team}
                            onChange={(e) => handleUpdateInitiativeField(ini.id, 'team', e.target.value)}
                            className="bg-transparent outline-none w-20 border-b border-transparent focus:border-slate-200"
                          />
                        </td>

                        {/* Delete option */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteInitiative(ini.id)}
                            className="text-[#86868b] hover:text-red-500 p-1.5 rounded-lg cursor-pointer"
                            title="Delete initiative item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          
          {/* Meeting Directory Left List */}
          <div className="lg:col-span-4 bg-white border border-[#e8e8ed] rounded-2xl p-4 shadow-sm space-y-4">
            <h3 className="font-semibold text-[#1d1d1f] text-xs uppercase tracking-wider pl-1.5 flex items-center gap-2 pb-1 border-b border-[#f5f5f7]">
              <Clock className="w-3.5 h-3.5" /> Core meeting rhythms
            </h3>

            <div className="space-y-2">
              {STANDARD_MEETING_AGENDAS.map(agenda => {
                const isActive = activeAgendaId === agenda.id;
                return (
                  <div
                    key={agenda.id}
                    onClick={() => {
                      setActiveAgendaId(agenda.id);
                      setSessionNotes('');
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex justify-between items-start gap-2 ${
                      isActive
                        ? 'border-[#1d1d1f] bg-[#fbfbfd] text-[#1d1d1f]'
                        : 'border-[#e8e8ed] bg-white text-[#86868b] hover:border-[#1d1d1f]'
                    }`}
                  >
                    <div className="space-y-1 text-xs">
                      <h4 className="font-semibold leading-tight">{agenda.name}</h4>
                      <p className="text-[10px] text-[#86868b] flex items-center gap-1 font-mono uppercase tracking-tight">
                        <Clock className="w-3 h-3" /> {agenda.frequency}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Agenda Protocol Detail & Note taker */}
          <div className="lg:col-span-8 bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm min-h-[440px] space-y-6">
            
            <div className="border-b border-[#f5f5f7] pb-4 space-y-2.5">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <h3 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2">
                  {activeAgenda.name}
                </h3>
                <span className="text-[10px] bg-[#f5f5f7] border border-[#e8e8ed] rounded-full px-3 py-1 font-mono font-bold uppercase text-[#1d1d1f]">
                  {activeAgenda.duration} Duration
                </span>
              </div>
              <p className="text-[#86868b] text-xs leading-relaxed font-semibold">
                Objective: {activeAgenda.purpose}
              </p>
              
              <div className="flex flex-wrap gap-4 pt-1 text-[11px] font-sans">
                <span className="text-[#86868b]">🧑‍🤝‍🧑 Participants: <strong className="text-[#1d1d1f] font-bold">{activeAgenda.participants}</strong></span>
                <span className="text-[#86868b] bg-[#f5f5f7] border border-[#e8e8ed] px-2 py-0.5 rounded-full font-bold uppercase text-[9px]">{activeAgenda.rule}</span>
              </div>
            </div>

            {/* Agenda sequence detail items */}
            <div className="space-y-3.5 font-sans">
              <h4 className="text-xs uppercase tracking-wider text-[#86868b] font-bold">Agenda Sequence Checklist:</h4>
              <div className="divide-y divide-[#f5f5f7] bg-[#fbfbfd] rounded-2xl border border-[#e8e8ed]">
                {activeAgenda.agendaItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 items-start text-xs">
                    <span className="text-[#1d1d1f] font-mono font-bold bg-neutral-100 border border-[#e8e8ed] rounded-full px-2.5 py-0.5 shrink-0 text-[10px] w-14 text-center">
                      {item.duration}
                    </span>
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-[#1d1d1f]">{item.topic}</h5>
                      <p className="text-[#86868b] text-xs leading-relaxed font-medium">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IDS / Note logs Sandbox */}
            <div className="border-t border-[#f5f5f7] pt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-start font-sans">
              
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-[#86868b] font-bold font-sans">Live minutes notes:</h4>
                <textarea
                  placeholder="Record immediate scorecard actions, IDS resolutions or to-do assignments..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] text-xs rounded-xl p-3 outline-none transition leading-relaxed resize-none"
                />
                <button
                  onClick={handleSaveNotes}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer"
                >
                  Publish Session Notes
                </button>
              </div>

              {/* History logs checklists */}
              <div className="space-y-3 text-xs">
                <h4 className="text-xs uppercase tracking-wider text-[#86868b] font-bold">Meeting notes archive:</h4>
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {recentNotesLog.length === 0 ? (
                    <p className="text-[#86868b] italic">No minutes recorded.</p>
                  ) : (
                    recentNotesLog.map((log, idx) => (
                      <div key={idx} className="bg-[#fbfbfd] border border-[#e8e8ed] rounded-2xl p-3.5 space-y-1 transition text-xs text-[#1d1d1f]">
                        <div className="flex justify-between items-center text-[10px] text-[#86868b]">
                          <span>{log.title}</span>
                          <span>{log.date}</span>
                        </div>
                        <p className="text-[#86868b] leading-relaxed text-[11px] font-medium">{log.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
