import { useState } from 'react';
import {
  Compass,
  Target,
  Heart,
  ShieldCheck,
  Trash2,
  Lock,
  CheckCircle2,
  Scale,
  Plus
} from 'lucide-react';
import { ClarityCompass, DecisionEvaluation, UserRole } from '../types';

interface ClarityCompassViewProps {
  compass: ClarityCompass;
  onUpdateCompass: (updated: ClarityCompass) => void;
  userRole?: UserRole;
}

export default function ClarityCompassView({
  compass,
  onUpdateCompass,
  userRole = 'ceo'
}: ClarityCompassViewProps) {
  const [newValItem, setNewValItem] = useState('');
  const [newAnchorItem, setNewAnchorItem] = useState('');

  // Quantitative Decision Evaluation Matrix State
  const [decisionName, setDecisionName] = useState('');
  const [companyScore, setCompanyScore] = useState(4);
  const [customerScore, setCustomerScore] = useState(4);
  const [cultureScore, setCultureScore] = useState(4);
  const [competitiveScore, setCompetitiveScore] = useState(4);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const isReadOnly =
    userRole === 'employee' || userRole === 'operator' || userRole === 'auditor';

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleUpdateCompassField = (field: keyof ClarityCompass, value: any) => {
    if (isReadOnly) return;
    onUpdateCompass({
      ...compass,
      [field]: value
    });
  };

  const handleAddValue = () => {
    if (isReadOnly || !newValItem.trim()) return;
    handleUpdateCompassField('coreValues', [...compass.coreValues, newValItem.trim()]);
    setNewValItem('');
    showFeedback('Core value added to Culture Case.');
  };

  const handleDeleteValue = (idx: number) => {
    if (isReadOnly) return;
    handleUpdateCompassField(
      'coreValues',
      compass.coreValues.filter((_, i) => i !== idx)
    );
  };

  const handleAddAnchor = () => {
    if (isReadOnly || !newAnchorItem.trim()) return;
    handleUpdateCompassField('strategicAnchors', [
      ...compass.strategicAnchors,
      newAnchorItem.trim()
    ]);
    setNewAnchorItem('');
    showFeedback('Strategic anchor added to Competitive Case.');
  };

  const handleDeleteAnchor = (idx: number) => {
    if (isReadOnly) return;
    handleUpdateCompassField(
      'strategicAnchors',
      compass.strategicAnchors.filter((_, i) => i !== idx)
    );
  };

  const computedOverallScore = Math.round(
    ((companyScore + customerScore + cultureScore + competitiveScore) / 20) * 100
  );
  const computedVerdict = computedOverallScore >= 70 ? 'GO' : 'NO-GO';

  const evaluations = compass.evaluations || [];

  const handleLogDecisionEvaluation = () => {
    if (isReadOnly) return;
    if (!decisionName.trim()) {
      showFeedback('Please provide a proposal or decision title before logging.');
      return;
    }

    const newEval: DecisionEvaluation = {
      id: `eval-${Date.now()}`,
      decisionName: decisionName.trim(),
      date: new Date().toISOString().split('T')[0],
      companyCaseScore: companyScore,
      companyCaseNotes: decisionNotes.trim(),
      customerCaseScore: customerScore,
      customerCaseNotes: '',
      cultureCaseScore: cultureScore,
      cultureCaseNotes: '',
      competitiveCaseScore: competitiveScore,
      competitiveCaseNotes: '',
      verdict: computedVerdict,
      overallScore: computedOverallScore
    };

    handleUpdateCompassField('evaluations', [newEval, ...evaluations]);
    setDecisionName('');
    setDecisionNotes('');
    showFeedback(`Decision "${newEval.decisionName}" logged (${newEval.overallScore}% — ${newEval.verdict}).`);
  };

  const handleDeleteEvaluation = (id: string) => {
    if (isReadOnly) return;
    handleUpdateCompassField(
      'evaluations',
      evaluations.filter((e) => e.id !== id)
    );
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      {feedbackMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs font-semibold"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-[10px] font-mono uppercase underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#e8e8ed] p-5 rounded-2xl shadow-2xs">
        <div className="space-y-1">
          <h2 className="text-xl font-display font-bold text-[#1d1d1f]">
            Clarity Compass & Strategic Decision Framework
          </h2>
          <p className="text-[#86868b] text-xs">
            "SaaS architectures scale on good features, but companies scale on good decision-making." Align team critical thinking across the 4C Strategic Cases.
          </p>
        </div>

        {isReadOnly ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-100 text-[10px] font-mono uppercase font-bold shrink-0">
            <Lock className="w-3 h-3" /> Read-Only Alignment Mode ({userRole.toUpperCase()})
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-mono uppercase font-bold shrink-0">
            👑 Strategic Edit Mode ({userRole.toUpperCase()})
          </div>
        )}
      </div>

      {/* Main Clarity Compass Visual Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-white border border-[#e8e8ed] p-5 rounded-2xl shadow-2xs">
        {/* Left 4 quadrants inputs */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-[#1d1d1f]">
          {/* COMPANY CASE */}
          <div className="border-2 border-[#1d1d1f] bg-[#fbfbfd] p-5 rounded-2xl flex flex-col justify-between shadow-2xs">
            <div className="space-y-1.5">
              <span className="font-display font-bold text-[#1d1d1f] uppercase tracking-wide flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-blue-600 shrink-0" />
                <span>COMPANY CASE (3-Y TARGET)</span>
              </span>
              <p className="text-[#86868b] text-xs font-medium">
                Does this project get us closer to our stated three-year performance goals?
              </p>
            </div>
            <textarea
              value={compass.threeYearTarget}
              onChange={(e) => handleUpdateCompassField('threeYearTarget', e.target.value)}
              disabled={isReadOnly}
              rows={3}
              className={`w-full bg-white border border-[#e8e8ed] focus:border-[#1d1d1f] rounded-xl p-3 outline-none mt-3 text-xs font-semibold leading-relaxed resize-none ${
                isReadOnly ? 'cursor-not-allowed text-neutral-500 bg-neutral-50' : ''
              }`}
              placeholder="Describe your 3-year target revenue, customer footprint, and unit goals..."
            />
          </div>

          {/* CUSTOMER CASE */}
          <div className="border-2 border-[#1d1d1f] bg-[#fbfbfd] p-5 rounded-2xl flex flex-col justify-between shadow-2xs">
            <div className="space-y-1.5">
              <span className="font-display font-bold text-[#1d1d1f] uppercase tracking-wide flex items-center gap-2 text-sm">
                <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                <span>CUSTOMER CASE (PURPOSE)</span>
              </span>
              <p className="text-[#86868b] text-xs font-medium">
                Does this align with our company's core mission and customer value statement?
              </p>
            </div>
            <textarea
              value={compass.purposeStatement}
              onChange={(e) => handleUpdateCompassField('purposeStatement', e.target.value)}
              disabled={isReadOnly}
              rows={3}
              className={`w-full bg-white border border-[#e8e8ed] focus:border-[#1d1d1f] rounded-xl p-3 outline-none mt-3 text-xs font-semibold leading-relaxed resize-none ${
                isReadOnly ? 'cursor-not-allowed text-neutral-500 bg-neutral-50' : ''
              }`}
              placeholder="Our core purpose is to solve..."
            />
          </div>

          {/* CULTURE CASE: Core values */}
          <div className="border-2 border-[#1d1d1f] bg-[#fbfbfd] p-5 rounded-2xl space-y-3 md:col-span-2 shadow-2xs">
            <div className="space-y-1">
              <span className="font-display font-bold text-[#1d1d1f] uppercase tracking-wide flex items-center gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>CULTURE CASE (CORE VALUES)</span>
              </span>
              <p className="text-[#86868b] text-xs font-medium">
                How does this validate our team core values and behavior metrics?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {compass.coreValues.length === 0 ? (
                  <p className="text-neutral-400 text-xs italic">No core values specified yet.</p>
                ) : (
                  compass.coreValues.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-white border border-[#e8e8ed] rounded-xl p-2.5 group transition text-xs"
                    >
                      <span className="font-bold text-[#1d1d1f] flex items-center gap-1.5">
                        &bull; {val}
                      </span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleDeleteValue(idx)}
                          className="text-[#86868b] hover:text-red-500 p-1 rounded-md transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {!isReadOnly ? (
                <div className="space-y-2">
                  <textarea
                    placeholder="Add custom value (e.g. Extreme Ownership)..."
                    value={newValItem}
                    onChange={(e) => setNewValItem(e.target.value)}
                    rows={2}
                    className="bg-white border border-[#e8e8ed] focus:border-[#1d1d1f] rounded-xl p-2.5 w-full outline-none text-xs font-medium resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddValue}
                    className="bg-[#1d1d1f] hover:bg-neutral-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center cursor-pointer transition w-full"
                  >
                    Save Core Value
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/50 border border-amber-100/60 rounded-xl text-amber-800 text-[11px] leading-relaxed flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Coordinate with Workspace Administrators to update corporate core behavior standards.</span>
                </div>
              )}
            </div>
          </div>

          {/* COMPETITIVE CASE: Strategic Anchors */}
          <div className="border-2 border-[#1d1d1f] bg-[#fbfbfd] p-5 rounded-2xl space-y-3 md:col-span-2 shadow-2xs">
            <div className="space-y-1">
              <span className="font-display font-bold text-[#1d1d1f] uppercase tracking-wide flex items-center gap-2 text-sm">
                <Compass className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>COMPETITIVE CASE (STRATEGIC ANCHORS)</span>
              </span>
              <p className="text-[#86868b] text-xs font-medium">
                How does this amplify our unique market advantages that competitors cannot match?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {compass.strategicAnchors.length === 0 ? (
                  <p className="text-neutral-400 text-xs italic">No strategic anchors specified yet.</p>
                ) : (
                  compass.strategicAnchors.map((anch, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-white border border-[#e8e8ed] rounded-xl p-2.5 group transition text-xs"
                    >
                      <span className="font-bold text-[#1d1d1f] flex items-center gap-1.5">
                        &bull; {anch}
                      </span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAnchor(idx)}
                          className="text-[#86868b] hover:text-red-500 p-1 rounded-md transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {!isReadOnly ? (
                <div className="space-y-2">
                  <textarea
                    placeholder="Add strategic anchor (e.g. Local-first data sovereignty)..."
                    value={newAnchorItem}
                    onChange={(e) => setNewAnchorItem(e.target.value)}
                    rows={2}
                    className="bg-white border border-[#e8e8ed] focus:border-[#1d1d1f] rounded-xl p-2.5 w-full outline-none text-xs font-medium resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddAnchor}
                    className="bg-[#1d1d1f] hover:bg-neutral-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center cursor-pointer transition w-full"
                  >
                    Save Strategic Anchor
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/50 border border-amber-100/60 rounded-xl text-amber-800 text-[11px] leading-relaxed flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Competitive advantage anchors are locked in read-only alignment mode.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Compass Radar & Alignment Summary */}
        <div className="lg:col-span-4 flex flex-col justify-center items-center p-5 border-t lg:border-t-0 lg:border-l border-[#e8e8ed] select-none">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-[#86868b]">
              ALIGNMENT RADAR
            </span>

            <div className="relative w-40 h-40 my-3 flex items-center justify-center bg-[#f5f5f7] rounded-full border border-[#e8e8ed] mx-auto">
              <Compass className="w-14 h-14 text-[#1d1d1f] opacity-80" />
              <div className="absolute top-2.5 text-[9px] font-mono tracking-tight text-[#86868b] uppercase">
                GOALS
              </div>
              <div className="absolute bottom-2.5 text-[9px] font-mono tracking-tight text-[#86868b] uppercase">
                MISSION
              </div>
              <div className="absolute left-2.5 text-[9px] font-mono tracking-tight text-[#86868b] uppercase rotate-90 origin-center">
                STRATEGY
              </div>
              <div className="absolute right-2.5 text-[9px] font-mono tracking-tight text-[#86868b] uppercase -rotate-90 origin-center">
                CULTURE
              </div>
            </div>

            <h4 className="font-display font-bold text-sm text-[#1d1d1f]">
              Decentralized Autonomy
            </h4>
            <p className="text-[#86868b] text-[11px] max-w-[210px] mx-auto leading-relaxed">
              Use the 4C Decision Evaluation Matrix below to score any candidate initiative before committing capital or sprint capacity.
            </p>
          </div>
        </div>
      </div>

      {/* Quantitative 4C Decision Evaluation Matrix ([FR-CMP-02]) */}
      <div
        id="decision-evaluation-matrix"
        className="bg-white border border-[#e8e8ed] rounded-2xl p-5 shadow-2xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f5f5f7] pb-4">
          <div className="space-y-1">
            <h3 className="text-base font-display font-bold text-[#1d1d1f] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#004b49]" />
              <span>Quantitative 4C Decision Evaluation Matrix</span>
            </h3>
            <p className="text-xs text-[#86868b]">
              Score strategic proposals from 1 (Weak Alignment) to 5 (High Leverage) across all four Compass cases. Proposals scoring &ge; 70% earn a GO recommendation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-[#86868b] block">
                Alignment Score
              </span>
              <strong className="text-lg font-display font-extrabold text-[#1d1d1f]">
                {computedOverallScore}%
              </strong>
            </div>
            <span
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold uppercase ${
                computedVerdict === 'GO'
                  ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-700 border border-rose-500/30'
              }`}
            >
              {computedVerdict} VERDICT
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-[#86868b] block mb-1">
                  Proposal / Initiative Title
                </label>
                <input
                  type="text"
                  id="decision-proposal-title-input"
                  value={decisionName}
                  onChange={(e) => setDecisionName(e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Launch East Africa Enterprise Node"
                  className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-[#86868b] block mb-1">
                  Executive Rationale / Notes
                </label>
                <input
                  type="text"
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Key assumptions or resource constraints..."
                  className="w-full bg-[#f5f5f7] border border-[#e8e8ed] rounded-xl px-3 py-2 text-xs font-medium outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Company Case (1-5)', val: companyScore, set: setCompanyScore },
                { label: 'Customer Case (1-5)', val: customerScore, set: setCustomerScore },
                { label: 'Culture Case (1-5)', val: cultureScore, set: setCultureScore },
                { label: 'Competitive (1-5)', val: competitiveScore, set: setCompetitiveScore }
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-[#fbfbfd] border border-[#e8e8ed] rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#86868b]">{item.label}</span>
                    <strong className="text-xs font-mono font-bold text-[#1d1d1f]">
                      {item.val}/5
                    </strong>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    disabled={isReadOnly}
                    value={item.val}
                    onChange={(e) => item.set(Number(e.target.value))}
                    className="w-full accent-[#004b49] cursor-pointer"
                  />
                </div>
              ))}
            </div>

            {!isReadOnly && (
              <button
                type="button"
                id="log-decision-evaluation-btn"
                onClick={handleLogDecisionEvaluation}
                className="px-4 py-2.5 rounded-xl bg-[#1d1d1f] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition hover:opacity-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Decision Evaluation</span>
              </button>
            )}
          </div>

          {/* Logged Evaluations History */}
          <div className="lg:col-span-5 bg-[#fbfbfd] border border-[#e8e8ed] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-[#86868b]">
                Logged Strategic Decisions ({evaluations.length})
              </span>
            </div>

            {evaluations.length === 0 ? (
              <p className="text-xs text-[#86868b] italic py-4 text-center">
                No formal decision evaluations logged yet. Score a proposal on the left to record it.
              </p>
            ) : (
              <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
                {evaluations.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white border border-[#e8e8ed] rounded-xl p-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#1d1d1f] truncate">{ev.decisionName}</div>
                      <div className="text-[10px] text-[#86868b] font-mono">
                        {ev.date} • 4C: {ev.companyCaseScore}/{ev.customerCaseScore}/
                        {ev.cultureCaseScore}/{ev.competitiveCaseScore}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                          ev.verdict === 'GO'
                            ? 'bg-emerald-500/15 text-emerald-700'
                            : 'bg-rose-500/15 text-rose-700'
                        }`}
                      >
                        {ev.overallScore}% ({ev.verdict})
                      </span>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEvaluation(ev.id)}
                          className="text-[#86868b] hover:text-red-500 p-1 cursor-pointer"
                          title="Delete evaluation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
