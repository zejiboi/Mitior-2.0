import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  PlusCircle, 
  HelpCircle,
  Sparkles,
  PieChart as PieIcon,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { ScorecardMetric, TeamMember, MetricCategory, SprintPlan, Playbook } from '../types';

// --- HELPER STRATEGIC TARGET MATCHERS & CALCULATORS ---

export const getSprintRelation = (metric: ScorecardMetric, sprintPlan?: SprintPlan) => {
  if (!sprintPlan) return null;
  const nameLower = metric.name.toLowerCase();

  // 1. Revenue comparison (Quarterly or Monthly goals)
  // If we assume a quarter has 12 weeks, we can divide by 12 to get weekly equivalencies!
  const isRevenue = nameLower.includes('revenue') || nameLower.includes('cash') || nameLower.includes('collected') || nameLower.includes('sales') || nameLower.includes('deal');

  if (isRevenue && metric.unit === '$') {
    const goodVal = parseFloat(sprintPlan.revenueGoalGood) || 0;
    const betterVal = parseFloat(sprintPlan.revenueGoalBetter) || 0;
    const bestVal = parseFloat(sprintPlan.revenueGoalBest) || 0;

    if (goodVal > 0) {
      const goodWeekly = Math.round(goodVal / 12);
      const betterWeekly = Math.round(betterVal / 12);
      const bestWeekly = Math.round(bestVal / 12);
      return {
        type: 'revenue',
        label: 'Sprint Rev Target',
        good: goodWeekly,
        better: betterWeekly,
        best: bestWeekly,
        displayLabel: `Sprint target: $${goodWeekly.toLocaleString()}/wk (Good), Better: $${betterWeekly.toLocaleString()}/wk, Best: $${bestWeekly.toLocaleString()}/wk`
      };
    }
  }

  // 2. Unit Goals (e.g. Active Trainees/Members)
  const isUnitGoal = sprintPlan.unitGoalName && (
    nameLower.includes(sprintPlan.unitGoalName.toLowerCase()) || 
    sprintPlan.unitGoalName.toLowerCase().includes(nameLower) ||
    nameLower.includes('member') || 
    nameLower.includes('trainee') ||
    nameLower.includes('subscriber') ||
    nameLower.includes('lead')
  );

  if (isUnitGoal) {
    const targetVal = parseFloat(sprintPlan.unitGoalValue) || 0;
    if (targetVal > 0) {
      return {
        type: 'unit',
        label: `Sprint Unit: ${sprintPlan.unitGoalName}`,
        good: targetVal,
        better: Math.round(targetVal * 1.05),
        best: Math.round(targetVal * 1.15),
        displayLabel: `Sprint target: ${targetVal.toLocaleString()} active`
      };
    }
  }

  // 3. Fallback to KPI's own defined target
  const metricTarget = parseFloat(metric.target) || 0;
  return {
    type: 'metric-default',
    label: 'Standard Target',
    good: metricTarget,
    better: Math.round(metricTarget * 1.05) || (metricTarget + 1),
    best: Math.round(metricTarget * 1.15) || (metricTarget + 2),
    displayLabel: `KPI Target: ${metricTarget.toLocaleString()}`
  };
};

export const getWeekValueStatus = (valueStr: string | undefined, relation: any) => {
  if (!valueStr || valueStr.trim() === '') return 'empty';
  const val = parseFloat(valueStr.replace(/[$,#% ]/g, ''));
  if (isNaN(val)) return 'invalid';

  if (!relation) return 'neutral';

  const good = relation.good || 0;
  if (good === 0) return 'neutral';

  const better = relation.better || good;
  const best = relation.best || better;

  if (val >= best) return 'best';      // meets/exceeds best
  if (val >= better) return 'better';  // meets/exceeds better
  if (val >= good) return 'good';      // meets/exceeds good target
  if (val >= good * 0.85) return 'warning'; // falls slightly below target (within 15%)
  return 'critical';                  // falls significantly below target
};

export const determineCalculatedStatusSimple = (metric: ScorecardMetric, sprintPlan?: SprintPlan): 'GREEN' | 'YELLOW' | 'RED' => {
  const weeks = ["W4", "W3", "W2", "W1"];
  let latestValue = "";
  for (const wk of weeks) {
    if (metric.weeklyActuals[wk]) {
      latestValue = metric.weeklyActuals[wk];
      break;
    }
  }
  if (!latestValue) return metric.status || 'GREEN';

  const relation = getSprintRelation(metric, sprintPlan);
  const status = getWeekValueStatus(latestValue, relation);

  if (status === 'best' || status === 'better' || status === 'good') return 'GREEN';
  if (status === 'warning') return 'YELLOW';
  if (status === 'critical') return 'RED';
  return metric.status || 'GREEN';
};

interface ScorecardViewProps {
  scorecard: ScorecardMetric[];
  teamMembers: TeamMember[];
  playbooks: Playbook[];
  onUpdateScorecard: (updated: ScorecardMetric[]) => void;
  sprintPlan?: SprintPlan;
}

export default function ScorecardView({
  scorecard,
  teamMembers,
  playbooks,
  onUpdateScorecard,
  sprintPlan,
}: ScorecardViewProps) {
  const [activeCategory, setActiveCategory] = useState<MetricCategory | 'all'>('all');
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(scorecard[0]?.id || null);
  
  // Set default selected if state is null but scorecard has elements
  if (!selectedMetricId && scorecard.length > 0) {
    setSelectedMetricId(scorecard[0].id);
  }

  // New Metric Creator states
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [newMetricName, setNewMetricName] = useState('');
  const [newMetricCat, setNewMetricCat] = useState<MetricCategory>('northstar');
  const [newMetricTarget, setNewMetricTarget] = useState('');
  const [newMetricUnit, setNewMetricUnit] = useState('$');
  const [newMetricSource, setNewMetricSource] = useState('Operations');
  const [newMetricOwner, setNewMetricOwner] = useState(teamMembers[0]?.id || 'tm-owner');
  const [newMetricPlaybookId, setNewMetricPlaybookId] = useState('');

  // Chart configuration state
  const [activePieTab, setActivePieTab] = useState<'health' | 'category'>('health');

  const filteredMetrics = scorecard.filter(m => activeCategory === 'all' || m.category === activeCategory);

  const handleUpdateMetricField = (metricId: string, field: keyof ScorecardMetric, value: any) => {
    const updated = scorecard.map(m => {
      if (m.id === metricId) {
        return { ...m, [field]: value };
      }
      return m;
    });
    onUpdateScorecard(updated);
  };

  const handleUpdateWeeklyActual = (metricId: string, weekId: string, value: string) => {
    const updated = scorecard.map(m => {
      if (m.id === metricId) {
        const weekly = { ...m.weeklyActuals, [weekId]: value };
        const nextMetric = { ...m, weeklyActuals: weekly };
        const calculatedStatus = determineCalculatedStatusSimple(nextMetric, sprintPlan);
        return { ...nextMetric, status: calculatedStatus };
      }
      return m;
    });
    onUpdateScorecard(updated);
  };

  const cycleStatus = (metricId: string, currentStatus: 'GREEN' | 'YELLOW' | 'RED') => {
    let nextStatus: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
    if (currentStatus === 'GREEN') nextStatus = 'YELLOW';
    else if (currentStatus === 'YELLOW') nextStatus = 'RED';
    else nextStatus = 'GREEN';

    handleUpdateMetricField(metricId, 'status', nextStatus);
  };

  const handleCreateMetric = () => {
    if (!newMetricName.trim()) return;

    const newMetric: ScorecardMetric = {
      id: `m-custom-${Date.now()}`,
      name: newMetricName,
      category: newMetricCat,
      weeklyActuals: { "W1": "", "W2": "", "W3": "", "W4": "" },
      target: newMetricTarget || "100",
      ownerId: newMetricOwner,
      status: "GREEN",
      metricSource: newMetricSource || "Operations",
      unit: newMetricUnit,
      notes: "Newly integrated benchmark",
      playbookId: newMetricPlaybookId || undefined
    };

    onUpdateScorecard([...scorecard, newMetric]);
    setNewMetricName('');
    setNewMetricTarget('');
    setNewMetricPlaybookId('');
    setIsAddingMetric(false);
  };

  const handleDeleteMetric = (metricId: string) => {
    const updated = scorecard.filter(m => m.id !== metricId);
    onUpdateScorecard(updated);
  };

  const getAverageActual = (metric: ScorecardMetric) => {
    const values = Object.values(metric.weeklyActuals)
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));
    
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / values.length);
  };

  // --- Recharts Pie Data Configuration ---
  const statusCounts = scorecard.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, { GREEN: 0, YELLOW: 0, RED: 0 } as Record<'GREEN' | 'YELLOW' | 'RED', number>);

  const statusPieData = [
    { name: '🟢 On Track (Green)', value: statusCounts.GREEN || 0, color: '#10b981' },
    { name: '🟡 Behind w/ Plan (Yellow)', value: statusCounts.YELLOW || 0, color: '#d97706' },
    { name: '🔴 Critical Action (Red)', value: statusCounts.RED || 0, color: '#dc2626' }
  ].filter(item => item.value > 0);

  // If scorecard is dry, inject beautiful default preview data for the chart to show
  const defaultStatusData = [
    { name: '🟢 On Track (Green)', value: 4, color: '#10b981' },
    { name: '🟡 Behind w/ Plan (Yellow)', value: 1, color: '#d97706' },
  ];

  const displayStatusData = statusPieData.length > 0 ? statusPieData : defaultStatusData;

  const categoryCounts = scorecard.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryLabels: Record<string, string> = {
    evergreen: '🌲 Evergreen Items',
    northstar: '⭐ North Star Focus',
    marketing: '📣 Marketing Sourcing',
    sales: '💼 Sales Funnel'
  };

  const categoryColors: Record<string, string> = {
    evergreen: '#047857', // Forest deep sage
    northstar: '#b45309', // Burnished Gold
    marketing: '#1d1d1f', // Luxury modern charcoal
    sales: '#4338ca' // Royal indigo
  };

  const categoryPieData = Object.entries(categoryCounts).map(([cat, count]) => ({
    name: categoryLabels[cat] || cat,
    value: count,
    color: categoryColors[cat] || '#86868b'
  })).filter(item => item.value > 0);

  const defaultCategoryData = [
    { name: '🌲 Evergreen Items', value: 2, color: '#047857' },
    { name: '⭐ North Star Focus', value: 3, color: '#b45309' }
  ];

  const displayCategoryData = categoryPieData.length > 0 ? categoryPieData : defaultCategoryData;

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      
      {/* Intro Panel - Apple Header layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-[#e8e8ed] p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-[#1d1d1f]">
            Company scorecard matrix
          </h2>
          <p className="text-[#86868b] text-xs max-w-xl">
            "Track metrics weekly, mirror your engines, and enter entries manually. Doing so builds absolute team ownership over strategic numbers, rather than simple passive reporting."
          </p>
        </div>

        {/* Categories Tab buttons */}
        <div className="flex flex-wrap gap-1 bg-[#f5f5f7] p-1 border border-[#e8e8ed] rounded-full">
          {(['all', 'evergreen', 'northstar', 'marketing', 'sales'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-[10px] uppercase font-semibold tracking-wider rounded-full transition cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#1d1d1f] text-white shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Banner - Simple clean text card */}
      <div className="bg-white border border-[#e8e8ed] rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-semibold text-[#1d1d1f] tracking-wider uppercase font-mono">
            CORE PROTOCOL: MANUALLY UPDATED WEEKLY KPI
          </span>
          <p className="font-semibold text-sm text-[#1d1d1f]">
            Update manual weekly inputs every Monday morning before team sprints.
          </p>
        </div>
        
        <div className="flex items-center gap-3.5 text-xs">
          <span className="text-[#86868b] font-mono">Status cycling guide:</span>
          <div className="flex gap-2 text-[10px] font-mono">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">🟢 ON TRACK</span>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100 font-bold">🟡 BEHIND W/ PLAN</span>
            <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-800 border border-red-100">🔴 CRITICAL</span>
          </div>
        </div>
      </div>

      {/* Manual Grid Spreadsheet */}
      <div className="bg-white border border-[#e8e8ed] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#fbfbfd] border-b border-[#e8e8ed] text-[#86868b] font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-6">Official KPI / Metric</th>
                <th className="py-3 px-2 text-center">Unit</th>
                <th className="py-3 px-2 text-center w-24">Week 1</th>
                <th className="py-3 px-2 text-center w-24">Week 2</th>
                <th className="py-3 px-2 text-center w-24">Week 3</th>
                <th className="py-3 px-2 text-center w-24">Week 4</th>
                <th className="py-3 px-2 text-center w-24">Target</th>
                <th className="py-3 px-3 text-center">Status (Manual Click)</th>
                <th className="py-3 px-4 font-bold">SOP Owner</th>
                <th className="py-3 px-4">Linked Playbook (SOP)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f7] text-xs text-[#1d1d1f]">
              {filteredMetrics.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-[#86868b]">No metrics active in this category.</td>
                </tr>
              ) : (
                filteredMetrics.map(m => {
                  const rel = getSprintRelation(m, sprintPlan);
                  const isSelectedRow = selectedMetricId === m.id;
                  return (
                     <tr 
                      key={m.id} 
                      onClick={() => setSelectedMetricId(m.id)}
                      className={`hover:bg-[#fbfbfd] transition cursor-pointer ${
                        isSelectedRow ? 'bg-indigo-50/20 dark:bg-indigo-950/20 border-l-2 border-indigo-600' : ''
                      }`}
                     >
                      
                      {/* Metric Name & Tag */}
                      <td className="py-3.5 px-6 font-semibold">
                        <div className="space-y-1 max-w-[240px]">
                          <span className="block text-[#1d1d1f]">{m.name}</span>
                          <span className="text-[9px] text-[#86868b] font-mono uppercase tracking-wider block">
                            {m.category} ARRAY
                          </span>
                          {/* Sprint Plan Matcher Info */}
                          {(() => {
                            if (rel && rel.type !== 'metric-default') {
                              return (
                                <div className="text-[9px] text-indigo-700 bg-indigo-50/60 border border-indigo-150 rounded px-1.5 py-0.5 inline-block font-mono font-medium max-w-full truncate" title={rel.displayLabel}>
                                  🎯 Sprint Match: {rel.label} ({rel.type === 'revenue' ? `wk eq: $${rel.good.toLocaleString()}` : rel.displayLabel})
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </td>

                      {/* Unit */}
                      <td className="py-3.5 px-2 text-center font-mono text-[#86868b]">
                        {m.unit}
                      </td>

                      {/* Week 1 Actual */}
                      <td className="py-3.5 px-2 text-center">
                        <div className="relative inline-block">
                          <input
                            type="text"
                            value={m.weeklyActuals["W1"] || ''}
                            onChange={(e) => handleUpdateWeeklyActual(m.id, "W1", e.target.value)}
                            className={`w-18 text-center rounded-lg p-1.5 outline-none text-xs font-bold border transition ${
                              (() => {
                                const status = getWeekValueStatus(m.weeklyActuals["W1"], rel);
                                if (status === 'best') return 'bg-emerald-50 text-emerald-800 border-emerald-400 focus:bg-white';
                                if (status === 'better') return 'bg-emerald-50 text-emerald-800 border-emerald-350 focus:bg-white';
                                if (status === 'good') return 'bg-[#ecfdf5] text-emerald-800 border-emerald-250 focus:bg-white';
                                if (status === 'warning') return 'bg-amber-50 text-amber-900 border-amber-300 focus:bg-white';
                                if (status === 'critical') return 'bg-rose-50/50 text-rose-900 border-rose-300 focus:bg-white';
                                return 'bg-[#f5f5f7] text-[#1d1d1f] border-[#e8e8ed] hover:bg-[#e8e8ed] focus:bg-white';
                              })()
                            }`}
                            placeholder="--"
                          />
                          {m.weeklyActuals["W1"] && (
                            <span className={`absolute -top-1 -right-1 flex h-2 w-2 rounded-full ring-2 ring-white ${
                              (() => {
                                const status = getWeekValueStatus(m.weeklyActuals["W1"], rel);
                                if (status === 'best') return 'bg-emerald-500 animate-pulse';
                                if (status === 'better' || status === 'good') return 'bg-emerald-500';
                                if (status === 'warning') return 'bg-amber-500';
                                if (status === 'critical') return 'bg-rose-500';
                                return 'bg-neutral-400';
                              })()
                            }`} />
                          )}
                        </div>
                      </td>

                      {/* Week 2 Actual */}
                      <td className="py-3.5 px-2 text-center">
                        <div className="relative inline-block">
                          <input
                            type="text"
                            value={m.weeklyActuals["W2"] || ''}
                            onChange={(e) => handleUpdateWeeklyActual(m.id, "W2", e.target.value)}
                            className={`w-18 text-center rounded-lg p-1.5 outline-none text-xs font-bold border transition ${
                              (() => {
                                const status = getWeekValueStatus(m.weeklyActuals["W2"], rel);
                                if (status === 'best') return 'bg-emerald-50 text-emerald-800 border-emerald-400 focus:bg-white';
                                if (status === 'better') return 'bg-emerald-50 text-emerald-800 border-emerald-350 focus:bg-white';
                                if (status === 'good') return 'bg-[#ecfdf5] text-emerald-800 border-emerald-250 focus:bg-white';
                                if (status === 'warning') return 'bg-amber-50 text-amber-900 border-amber-300 focus:bg-white';
                                if (status === 'critical') return 'bg-rose-50/50 text-rose-900 border-rose-300 focus:bg-white';
                                return 'bg-[#f5f5f7] text-[#1d1d1f] border-[#e8e8ed] hover:bg-[#e8e8ed] focus:bg-white';
                              })()
                            }`}
                            placeholder="--"
                          />
                          {m.weeklyActuals["W2"] && (
                            <span className={`absolute -top-1 -right-1 flex h-2 w-2 rounded-full ring-2 ring-white ${
                              (() => {
                                const status = getWeekValueStatus(m.weeklyActuals["W2"], rel);
                                if (status === 'best') return 'bg-emerald-500 animate-pulse';
                                if (status === 'better' || status === 'good') return 'bg-emerald-500';
                                if (status === 'warning') return 'bg-amber-500';
                                if (status === 'critical') return 'bg-rose-500';
                                return 'bg-neutral-400';
                              })()
                            }`} />
                          )}
                        </div>
                      </td>

                      {/* Week 3 Actual */}
                      <td className="py-3.5 px-2 text-center">
                        <div className="relative inline-block">
                          <input
                            type="text"
                            value={m.weeklyActuals["W3"] || ''}
                            onChange={(e) => handleUpdateWeeklyActual(m.id, "W3", e.target.value)}
                            className={`w-18 text-center rounded-lg p-1.5 outline-none text-xs font-bold border transition ${
                              (() => {
                                const status = getWeekValueStatus(m.weeklyActuals["W3"], rel);
                                if (status === 'best') return 'bg-emerald-50 text-emerald-800 border-emerald-400 focus:bg-white';
                                if (status === 'better') return 'bg-emerald-50 text-emerald-800 border-emerald-350 focus:bg-white';
                                if (status === 'good') return 'bg-[#ecfdf5] text-emerald-800 border-emerald-250 focus:bg-white';
                                if (status === 'warning') return 'bg-amber-50 text-amber-900 border-amber-300 focus:bg-white';
                                if (status === 'critical') return 'bg-rose-50/50 text-rose-900 border-rose-300 focus:bg-white';
                                return 'bg-[#f5f5f7] text-[#1d1d1f] border-[#e8e8ed] hover:bg-[#e8e8ed] focus:bg-white';
                              })()
                            }`}
                            placeholder="--"
                          />
                          {m.weeklyActuals["W3"] && (
                            <span className={`absolute -top-1 -right-1 flex h-2 w-2 rounded-full ring-2 ring-white ${
                              (() => {
                                const status = getWeekValueStatus(m.weeklyActuals["W3"], rel);
                                if (status === 'best') return 'bg-emerald-500 animate-pulse';
                                if (status === 'better' || status === 'good') return 'bg-emerald-500';
                                if (status === 'warning') return 'bg-amber-500';
                                if (status === 'critical') return 'bg-rose-500';
                                return 'bg-neutral-400';
                              })()
                            }`} />
                          )}
                        </div>
                      </td>

                      {/* Week 4 Actual */}
                      <td className="py-3.5 px-2 text-center">
                        <div className="relative inline-block">
                          <input
                            type="text"
                            value={m.weeklyActuals["W4"] || ''}
                            onChange={(e) => handleUpdateWeeklyActual(m.id, "W4", e.target.value)}
                            className={`w-18 text-center rounded-lg p-1.5 outline-none text-xs font-bold border transition ${
                              (() => {
                                const status = getWeekValueStatus(m.weeklyActuals["W4"], rel);
                                if (status === 'best') return 'bg-emerald-50 text-emerald-800 border-emerald-400 focus:bg-white';
                                if (status === 'better') return 'bg-emerald-50 text-emerald-800 border-emerald-350 focus:bg-white';
                                if (status === 'good') return 'bg-[#ecfdf5] text-emerald-800 border-emerald-250 focus:bg-white';
                                if (status === 'warning') return 'bg-amber-50 text-amber-900 border-amber-300 focus:bg-white';
                                if (status === 'critical') return 'bg-rose-50/50 text-rose-900 border-rose-300 focus:bg-white';
                                return 'bg-[#f5f5f7] text-[#1d1d1f] border-[#e8e8ed] hover:bg-[#e8e8ed] focus:bg-white';
                              })()
                            }`}
                            placeholder="--"
                          />
                          {m.weeklyActuals["W4"] && (
                            <span className={`absolute -top-1 -right-1 flex h-2 w-2 rounded-full ring-2 ring-white ${
                              (() => {
                                const status = getWeekValueStatus(m.weeklyActuals["W4"], rel);
                                if (status === 'best') return 'bg-emerald-500 animate-pulse';
                                if (status === 'better' || status === 'good') return 'bg-emerald-500';
                                if (status === 'warning') return 'bg-amber-500';
                                if (status === 'critical') return 'bg-rose-500';
                                return 'bg-neutral-400';
                              })()
                            }`} />
                          )}
                        </div>
                      </td>

                      {/* Target */}
                      <td className="py-3.5 px-2 text-center">
                        <div className="relative inline-block group">
                          <input
                            type="text"
                            value={m.target}
                            onChange={(e) => handleUpdateMetricField(m.id, 'target', e.target.value)}
                            className={`w-18 border rounded-lg p-1.5 text-center outline-none text-xs font-semibold focus:border-[#1d1d1f] transition ${
                              rel && rel.type !== 'metric-default'
                                ? 'border-indigo-300 bg-indigo-50/60 text-indigo-900'
                                : 'bg-white border-[#e8e8ed] text-[#1d1d1f]'
                            }`}
                            title={rel ? rel.displayLabel : 'KPI Goal'}
                          />
                          {rel && rel.type !== 'metric-default' && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white" title="Linked directly to active Sprint Target" />
                          )}
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => cycleStatus(m.id, m.status)}
                            className={`px-3 py-1 text-[9px] font-bold rounded-full uppercase tracking-tight transition cursor-pointer ${
                              m.status === 'GREEN' 
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-600 hover:text-white' 
                                : m.status === 'YELLOW'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200 hover:bg-amber-500 hover:text-white'
                                : 'bg-rose-100 text-rose-900 border border-rose-200 hover:bg-rose-650 hover:text-white'
                            }`}
                            title="Click to manually override status"
                          >
                            {m.status === 'GREEN' ? '🟢 GREEN' : m.status === 'YELLOW' ? '🟡 YELLOW' : '🔴 RED'}
                          </button>
                          
                          {/* Auto Calculated Indicator */}
                          {(() => {
                            // Find latest week
                            const weeks = ["W4", "W3", "W2", "W1"];
                            let latestVal = "";
                            let latestWk = "";
                            for (const wk of weeks) {
                              if (m.weeklyActuals[wk]) {
                                latestVal = m.weeklyActuals[wk];
                                latestWk = wk;
                                break;
                              }
                            }
                            if (latestVal) {
                              const st = getWeekValueStatus(latestVal, rel);
                              const labels = {
                                best: '🏆 Exceeds Best',
                                better: '🚀 Exceeds Better',
                                good: '✓ Meets Target',
                                warning: '⚠ Near Target',
                                critical: '✖ Below Target'
                              };
                              const colors = {
                                best: 'text-emerald-700 bg-emerald-50/60 border-emerald-200',
                                better: 'text-emerald-700 bg-emerald-50/40 border-emerald-150',
                                good: 'text-emerald-600 bg-emerald-50/20 border-emerald-100',
                                warning: 'text-amber-700 bg-amber-50/50 border-amber-200 font-bold',
                                critical: 'text-rose-700 bg-rose-50/50 border-rose-200'
                              };
                              const finalLabel = labels[st as keyof typeof labels] || 'Analyzed';
                              const finalColor = colors[st as keyof typeof colors] || 'text-neutral-500 bg-neutral-50 border-neutral-200';
                              return (
                                <span className={`text-[8px] font-semibold px-1 py-0.5 rounded border uppercase font-mono tracking-tight shrink-0 ${finalColor}`} title="Calculated from latest entered week compared to targets">
                                  {latestWk}: {finalLabel}
                                </span>
                              );
                            }
                            return (
                              <span className="text-[8px] font-mono text-neutral-400">
                                No inputs
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-4 text-[#8a8a8f] font-semibold">
                        <select
                          value={m.ownerId}
                          onChange={(e) => handleUpdateMetricField(m.id, 'ownerId', e.target.value)}
                          className="bg-white border border-[#e8e8ed] text-xs rounded-lg p-1.5 outline-none cursor-pointer max-w-[120px]"
                        >
                          {teamMembers.map(tm => (
                            <option key={tm.id} value={tm.id}>{tm.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Linked Playbook */}
                      <td className="py-3.5 px-4">
                        <select
                          value={m.playbookId || ''}
                          onChange={(e) => handleUpdateMetricField(m.id, 'playbookId', e.target.value || undefined)}
                          className="bg-white border border-[#e8e8ed] text-xs rounded-lg p-1.5 outline-none cursor-pointer max-w-[150px] font-sans font-medium"
                        >
                          <option value="">-- No SOP Linked --</option>
                          {playbooks.map(pb => (
                            <option key={pb.id} value={pb.id}>
                              {pb.title.split(':')[0]}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Delete */}
                      <td className="py-3.5 px-4 text-center text-xs">
                        <button
                          onClick={() => handleDeleteMetric(m.id)}
                          className="text-[#86868b] hover:text-red-500 p-1.5 rounded-lg transition cursor-pointer"
                          title="Delete metric"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Recharts Pie Chart on the outer grid column, side-by-side with trend insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* A. Recharts Pie Chart (New high visibility section!) */}
        <div className="lg:col-span-4 bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-[#f5f5f7] pb-3">
            <h3 className="font-semibold text-[#1d1d1f] text-sm flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-purple-600" />
              Metrics Breakdown Pie
            </h3>
            <div className="flex rounded-full bg-neutral-100 p-0.5 text-[9px] font-bold">
              <button 
                onClick={() => setActivePieTab('health')}
                className={`px-2 py-1 rounded-full cursor-pointer transition ${activePieTab === 'health' ? 'bg-white text-black shadow-xs' : 'text-neutral-500'}`}
              >
                Health
              </button>
              <button 
                onClick={() => setActivePieTab('category')}
                className={`px-2 py-1 rounded-full cursor-pointer transition ${activePieTab === 'category' ? 'bg-white text-black shadow-xs' : 'text-neutral-500'}`}
              >
                Category
              </button>
            </div>
          </div>

          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activePieTab === 'health' ? displayStatusData : displayCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(activePieTab === 'health' ? displayStatusData : displayCategoryData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ fontSize: '11px', borderRadius: '10px', background: '#1d1d1f', color: '#fff', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {scorecard.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/85">
                <span className="text-[10px] uppercase font-bold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                  PREVIEW GRAPH
                </span>
              </div>
            )}
          </div>

          {/* Slices legend */}
          <div className="space-y-1.5 pt-2 border-t border-slate-50 text-[11px] font-semibold text-[#1d1d1f]">
            {(activePieTab === 'health' ? displayStatusData : displayCategoryData).map((entry, i) => (
              <div key={i} className="flex justify-between items-center bg-neutral-50 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}</span>
                </div>
                <span className="font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {entry.value} item{entry.value !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* B. Performance trend chart styled beautifully */}
        {(() => {
          const selectedMetric = scorecard.find(m => m.id === selectedMetricId) || scorecard[0];
          const trendData = selectedMetric ? [
            { name: 'Week 1', Actual: parseFloat(selectedMetric.weeklyActuals["W1"]) || 0, Target: parseFloat(selectedMetric.target) || 0 },
            { name: 'Week 2', Actual: parseFloat(selectedMetric.weeklyActuals["W2"]) || 0, Target: parseFloat(selectedMetric.target) || 0 },
            { name: 'Week 3', Actual: parseFloat(selectedMetric.weeklyActuals["W3"]) || 0, Target: parseFloat(selectedMetric.target) || 0 },
            { name: 'Week 4', Actual: parseFloat(selectedMetric.weeklyActuals["W4"]) || 0, Target: parseFloat(selectedMetric.target) || 0 },
          ] : [
            { name: 'Week 1', Actual: 0, Target: 100 },
            { name: 'Week 2', Actual: 0, Target: 100 },
            { name: 'Week 3', Actual: 0, Target: 100 },
            { name: 'Week 4', Actual: 0, Target: 100 },
          ];

          return (
            <div className="lg:col-span-5 bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-semibold text-[#1d1d1f] text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#8a8a8f]" />
                Interactive Target vs. Actuals Trend
              </h3>
              <p className="text-xs text-[#86868b] leading-relaxed">
                {selectedMetric 
                  ? `Active parameter review: ${selectedMetric.name} (Goal Target: ${selectedMetric.target}${selectedMetric.unit})`
                  : "Tap on any scorecard row above to inspect its live comparative trend."
                }
              </p>

              <div className="border border-[#e8e8ed] bg-[#fbfbfd] rounded-2xl p-4 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-primary)" opacity={0.6} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }} />
                    <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: '10px', color: 'var(--text-secondary)' }} />
                    <Line type="monotone" dataKey="Actual" stroke="var(--text-primary)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    <Line type="monotone" strokeDasharray="5 5" dataKey="Target" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* C. Quick KPI Creator Form */}
        <div className="lg:col-span-3 bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-[#1d1d1f] flex items-center gap-1.5 text-sm">
            <PlusCircle className="w-4 h-4 text-[#86868b]" />
            Integrate new metric
          </h3>

          <div className="space-y-3.5 text-xs">
            {/* Metric Name */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#86868b] block">Metric Label</label>
              <input
                type="text"
                placeholder="e.g. Conversion rate"
                value={newMetricName}
                onChange={(e) => setNewMetricName(e.target.value)}
                className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] p-2 rounded-xl w-full outline-none font-semibold text-[#1d1d1f] text-xs transition"
              />
            </div>

            {/* Category selection */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#86868b] block">Category Allocation</label>
              <select
                value={newMetricCat}
                onChange={(e) => setNewMetricCat(e.target.value as any)}
                className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] p-2 rounded-xl w-full cursor-pointer outline-none transition text-xs font-semibold"
              >
                <option value="evergreen">Evergreen Performance Items</option>
                <option value="northstar">North Star Focus KPIs</option>
                <option value="marketing">Marketing Sourcing</option>
                <option value="sales">Sales Funnel</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Goal Target */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#86868b] block">Weekly Target</label>
                <input
                  type="text"
                  placeholder="e.g. 50"
                  value={newMetricTarget}
                  onChange={(e) => setNewMetricTarget(e.target.value)}
                  className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] p-2 rounded-xl w-full outline-none font-semibold text-[#1d1d1f] text-xs transition"
                />
              </div>

              {/* Symbol/Unit */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#86868b] block">Unit Symbol</label>
                <input
                  type="text"
                  placeholder="e.g. %"
                  value={newMetricUnit}
                  onChange={(e) => setNewMetricUnit(e.target.value)}
                  className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] p-2 rounded-xl w-full outline-none font-semibold text-[#1d1d1f] text-xs transition"
                />
              </div>
            </div>

            {/* Link to Playbook */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#86868b] block">Link to Playbook / SOP (Optional)</label>
              <select
                value={newMetricPlaybookId}
                onChange={(e) => setNewMetricPlaybookId(e.target.value)}
                className="bg-[#f5f5f7] border border-[#e8e8ed] focus:border-[#1d1d1f] p-2 rounded-xl w-full cursor-pointer outline-none transition text-xs font-semibold text-[#1d1d1f]"
              >
                <option value="">-- No Linked Playbook --</option>
                {playbooks.map(pb => (
                  <option key={pb.id} value={pb.id}>
                    {pb.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleCreateMetric}
              className="w-full bg-[#1d1d1f] hover:bg-neutral-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Save Scorecard Entry
            </button>
          </div>
        </div>

      </div>

      {/* Playbook Completion Scorecard Analysis Section */}
      <div className="bg-white border border-[#e8e8ed] rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#f5f5f7] pb-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-[#1d1d1f] text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              Playbook Completion Scorecard
            </h3>
            <p className="text-xs text-[#86868b]">
              Verify process integrity: Direct correlation showing how completed SOPs (playbooks) drive on-target metric success.
            </p>
          </div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-3 py-1.5 rounded-full border border-indigo-150 uppercase tracking-wider font-mono">
            SOP Metric Impact Core
          </span>
        </div>

        {/* Big Insight Stats Bar */}
        {(() => {
          const linkedMetrics = scorecard.filter(m => m.playbookId);
          const totalLinked = linkedMetrics.length;
          
          let totalCompletion = 0;
          let greenLinkedCount = 0;
          let redYellowLinkedCount = 0;
          let highlyCompleteGreenCount = 0; // >= 70% comp and green
          let incompleteRedYellowCount = 0; // < 70% comp and red/yellow

          linkedMetrics.forEach(m => {
            const pb = playbooks.find(p => p.id === m.playbookId);
            if (pb) {
              const totalSteps = pb.steps ? pb.steps.length : 0;
              const doneSteps = pb.steps ? pb.steps.filter(s => s.done).length : 0;
              const rate = totalSteps > 0 ? (doneSteps / totalSteps) * 105 : 100;
              const normalizedRate = Math.min(100, Math.round(rate));
              totalCompletion += normalizedRate;

              if (m.status === 'GREEN') {
                greenLinkedCount++;
                if (normalizedRate >= 70) highlyCompleteGreenCount++;
              } else {
                redYellowLinkedCount++;
                if (normalizedRate < 70) incompleteRedYellowCount++;
              }
            }
          });

          const avgSopCompletion = totalLinked > 0 ? Math.round(totalCompletion / totalLinked) : 0;
          const linkageRate = scorecard.length > 0 ? Math.round((totalLinked / scorecard.length) * 100) : 0;

          // Proving the impact statement:
          const correlationStrength = highlyCompleteGreenCount + incompleteRedYellowCount;
          const correlationPercent = totalLinked > 0 ? Math.round((correlationStrength / totalLinked) * 100) : 100;

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Stat 1: Connection Coverage */}
                <div className="bg-[#fbfbfd] border border-[#e8e8ed] rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider block">Connected Coverage</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-[#1d1d1f]">{totalLinked} / {scorecard.length}</span>
                    <span className="text-xs text-[#86868b] font-semibold">({linkageRate}% metrics mapped)</span>
                  </div>
                  <p className="text-[10.5px] text-[#86868b] leading-tight">
                    KPIs mapped directly to step-by-step Standard Operating Procedures.
                  </p>
                </div>

                {/* Stat 2: SOP Completion Level */}
                <div className="bg-[#fbfbfd] border border-[#e8e8ed] rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-[#86868b] font-bold uppercase tracking-wider block">Average SOP Completion</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-extrabold ${avgSopCompletion >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{avgSopCompletion}%</span>
                    <span className="text-xs text-[#86868b] font-semibold">SOP Compliance</span>
                  </div>
                  <p className="text-[10.5px] text-[#86868b] leading-tight">
                    Process completeness across linked operating checklists.
                  </p>
                </div>

                {/* Stat 3: Metric Correlation Index */}
                <div className="bg-indigo-50/40 border border-indigo-150/60 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-indigo-800 font-bold uppercase tracking-wider block">Operational Synergy Proof</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-indigo-700">{correlationPercent}%</span>
                    <span className="text-xs text-indigo-800 font-bold">Accuracy Proof</span>
                  </div>
                  <p className="text-[10.5px] text-indigo-900/80 leading-tight block font-sans">
                    {correlationPercent >= 70 
                      ? "High correlation proven. Keeping Playbooks up-to-date corresponds directly to healthy on-target KPIs."
                      : "Unfinished playbooks correlate directly to metrics falling below targets."
                    }
                  </p>
                </div>

              </div>

              {/* Connected Grid List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">
                  Process Alignment Analysis
                </h4>
                
                {totalLinked === 0 ? (
                  <div className="text-center py-8 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 space-y-2">
                    <FileText className="w-8 h-8 text-neutral-400 mx-auto" />
                    <p className="text-xs text-neutral-500 font-semibold max-w-sm mx-auto">
                      No scorecard metrics linked to playbooks yet. Set up SOP playbooks in the spreadsheet's "Linked Playbook" dropdown above to see correlation analytics.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {linkedMetrics.map(m => {
                      const pb = playbooks.find(p => p.id === m.playbookId);
                      if (!pb) return null;

                      const totalSteps = pb.steps ? pb.steps.length : 0;
                      const doneSteps = pb.steps ? pb.steps.filter(s => s.done).length : 0;
                      const rate = totalSteps > 0 ? (doneSteps / totalSteps) * 105 : 0;
                      const normalizedRate = Math.min(100, Math.round(rate));
                      
                      // Relation diagnosis
                      let diagLabel = "Optimal Alignment";
                      let diagCol = "text-emerald-800 bg-emerald-50/80 border-emerald-200";
                      let diagDesc = "Active SOP steps are completed. Direct contribution to healthy on-target KPI performance.";

                      if (m.status !== 'GREEN' && normalizedRate < 70) {
                        diagLabel = "Execution Gap (Action Required)";
                        diagCol = "text-rose-800 bg-rose-50/80 border-rose-250 animate-pulse";
                        diagDesc = "KPI is behind target and checklist steps are incomplete. Finish the playbook tasks to restore metric health.";
                      } else if (m.status !== 'GREEN' && normalizedRate >= 70) {
                        diagLabel = "Strategy Constraint";
                        diagCol = "text-amber-800 bg-amber-50/60 border-amber-200";
                        diagDesc = "Checklist is fully completed, yet the KPI is failing. The process layout needs strategic optimization.";
                      } else if (m.status === 'GREEN' && normalizedRate < 70) {
                        diagLabel = "Hero Vulnerability (Warning)";
                        diagCol = "text-blue-800 bg-blue-50/80 border-blue-200";
                        diagDesc = "KPI is green by raw effort, but low playbook compliance introduces high bottleneck risk during team scaling.";
                      }

                      return (
                        <div key={m.id} className="border border-[#e8e8ed] rounded-xl p-4 bg-white space-y-3.5 hover:shadow-xs transition duration-150">
                          
                          {/* Heading: Metric Name and connected SOP */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-0.5 animate-pulse-slow">
                              <span className="font-bold text-[#1d1d1f] text-sm block">
                                {m.name}
                              </span>
                              <span className="text-[10px] text-[#86868b] font-mono block">
                                Measured by: <strong className="text-neutral-750">{pb.title}</strong>
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                              m.status === 'GREEN' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : m.status === 'YELLOW'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-250'
                            }`}>
                              {m.status}
                            </span>
                          </div>

                          {/* Compliance progress bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10.5px]">
                              <span className="text-neutral-500 font-medium font-sans">SOP Checklist Performance:</span>
                              <strong className="text-[#1d1d1f]">{doneSteps} / {totalSteps} Steps ({normalizedRate}%)</strong>
                            </div>
                            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden border border-[#e8e8ed]">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  normalizedRate >= 75 ? 'bg-emerald-500' : normalizedRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${normalizedRate}%` }}
                              />
                            </div>
                          </div>

                          {/* Diagnosis badge */}
                          <div className={`p-3 rounded-lg border text-[11px] font-semibold leading-relaxed ${diagCol}`}>
                            <div className="font-black uppercase tracking-wide text-[10px] mb-0.5 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                              {diagLabel}
                            </div>
                            {diagDesc}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
