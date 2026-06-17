import { useState } from 'react';
import { 
  Compass, 
  Target, 
  Heart, 
  ShieldCheck, 
  Trash2, 
  Lock
} from 'lucide-react';
import { ClarityCompass } from '../types';

interface ClarityCompassViewProps {
  compass: ClarityCompass;
  onUpdateCompass: (updated: ClarityCompass) => void;
  userRole?: 'ceo' | 'employee';
}

export default function ClarityCompassView({
  compass,
  onUpdateCompass,
  userRole = 'ceo'
}: ClarityCompassViewProps) {
  // Edits templates buffers
  const [newValItem, setNewValItem] = useState('');
  const [newAnchorItem, setNewAnchorItem] = useState('');

  const isEmployee = userRole === 'employee';

  const handleUpdateCompassField = (field: keyof ClarityCompass, value: any) => {
    if (isEmployee) return;
    onUpdateCompass({
      ...compass,
      [field]: value
    });
  };

  const handleAddValue = () => {
    if (isEmployee || !newValItem.trim()) return;
    handleUpdateCompassField('coreValues', [...compass.coreValues, newValItem.trim()]);
    setNewValItem('');
  };

  const handleDeleteValue = (idx: number) => {
    if (isEmployee) return;
    handleUpdateCompassField('coreValues', compass.coreValues.filter((_, i) => i !== idx));
  };

  const handleAddAnchor = () => {
    if (isEmployee || !newAnchorItem.trim()) return;
    handleUpdateCompassField('strategicAnchors', [...compass.strategicAnchors, newAnchorItem.trim()]);
    setNewAnchorItem('');
  };

  const handleDeleteAnchor = (idx: number) => {
    if (isEmployee) return;
    handleUpdateCompassField('strategicAnchors', compass.strategicAnchors.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      
      {/* Header Banner - Apple layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-[#e8e8ed] p-6 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-[#1d1d1f]">
            Clarity compass framework
          </h2>
          <p className="text-[#86868b] text-xs">
            "SaaS architectures scale on good features, but companies scale on good decision-making." Align team critical thinking to make high-quality strategic calls.
          </p>
        </div>

        {isEmployee ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-100 text-[10px] font-mono uppercase font-bold shrink-0">
            <Lock className="w-3 h-3" /> Read-Only Alignment Mode
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-mono uppercase font-bold shrink-0">
            👑 Administrator Edit Mode
          </div>
        )}
      </div>

      <div className="space-y-8 animate-fade-in">
        
        {/* Main Clarity Compass Visual layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-white border border-[#e8e8ed] p-6 rounded-2xl shadow-sm">
          
          {/* Left 4 quadrants inputs */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[#1d1d1f]">
            
            {/* COMPANY CASE */}
            <div className="border-2 border-[#1d1d1f] bg-[#fbfbfd] p-6 rounded-2xl flex flex-col justify-between shadow-xs transition hover:shadow-md">
              <div className="space-y-2">
                <span className="font-bold text-[#1d1d1f] uppercase tracking-wide flex items-center gap-2 text-base">
                  <Target className="w-5 h-5 text-blue-600 animate-pulse shrink-0" />
                  <span>COMPANY CASE (3-Y TARGET)</span>
                </span>
                <p className="text-[#86868b] text-xs font-medium font-sans">Does this project get us closer to our stated three-year performance goals?</p>
              </div>
              <textarea
                value={compass.threeYearTarget}
                onChange={(e) => handleUpdateCompassField('threeYearTarget', e.target.value)}
                disabled={isEmployee}
                rows={3}
                className={`w-full bg-white border border-[#e8e8ed] focus:border-[#1d1d1f] focus:ring-2 focus:ring-blue-100 rounded-xl p-3 outline-none mt-4 text-xs font-semibold leading-relaxed resize-none shadow-inner ${
                  isEmployee ? 'cursor-not-allowed text-neutral-500 bg-neutral-50 border-neutral-100' : ''
                }`}
                placeholder="Describe your target revenue, trainee goals, etc..."
              />
            </div>

            {/* CUSTOMER CASE */}
            <div className="border-2 border-[#1d1d1f] bg-[#fbfbfd] p-6 rounded-2xl flex flex-col justify-between shadow-xs transition hover:shadow-md">
              <div className="space-y-2">
                <span className="font-bold text-[#1d1d1f] uppercase tracking-wide flex items-center gap-2 text-base">
                  <Heart className="w-5 h-5 text-rose-500 animate-pulse shrink-0" />
                  <span>CUSTOMER CASE (PURPOSE)</span>
                </span>
                <p className="text-[#86868b] text-xs font-medium font-sans">Does this align with our company's core mission and customer value statement?</p>
              </div>
              <textarea
                value={compass.purposeStatement}
                onChange={(e) => handleUpdateCompassField('purposeStatement', e.target.value)}
                disabled={isEmployee}
                rows={3}
                className={`w-full bg-white border border-[#e8e8ed] focus:border-[#1d1d1f] focus:ring-2 focus:ring-rose-100 rounded-xl p-3 outline-none mt-4 text-xs font-semibold leading-relaxed resize-none shadow-inner ${
                  isEmployee ? 'cursor-not-allowed text-neutral-500 bg-neutral-50 border-neutral-100' : ''
                }`}
                placeholder="Our core purpose is to solve..."
              />
            </div>

            {/* CULTURE CASE: Core values */}
            <div className="border-2 border-[#1d1d1f] bg-[#fbfbfd] p-6 rounded-2xl space-y-4 md:col-span-2 shadow-xs transition hover:shadow-md">
              <div className="space-y-1">
                <span className="font-bold text-[#1d1d1f] uppercase tracking-wide flex items-center gap-2 text-base">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>CULTURE CASE (CORE VALUES)</span>
                </span>
                <p className="text-[#86868b] text-xs font-medium font-sans">How does this validate our team core values and behavior metrics?</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {compass.coreValues.length === 0 ? (
                    <p className="text-neutral-400 text-xs italic">No core values specified yet.</p>
                  ) : (
                    compass.coreValues.map((val, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white border border-[#e8e8ed] hover:border-[#1d1d1f] rounded-xl p-3 group transition text-xs shadow-xs">
                        <span className="font-bold text-[#1d1d1f] flex items-center gap-1.5">&bull; {val}</span>
                        {!isEmployee && (
                          <button
                            onClick={() => handleDeleteValue(idx)}
                            className="opacity-0 group-hover:opacity-100 text-[#86868b] hover:text-red-500 p-1 rounded-md transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {!isEmployee ? (
                  <div className="space-y-2.5">
                    <textarea
                      placeholder="Add custom value (e.g. Extreme Ownership)..."
                      value={newValItem}
                      onChange={(e) => setNewValItem(e.target.value)}
                      rows={2}
                      className="bg-white border border-[#e8e8ed] focus:border-[#1d1d1f] rounded-xl p-2.5 w-full outline-none text-xs font-medium resize-none shadow-xs"
                    />
                    <button
                      onClick={handleAddValue}
                      className="bg-[#1d1d1f] hover:bg-neutral-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center cursor-pointer transition w-full shadow-xs"
                    >
                      Save Core Value
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/50 border border-amber-100/60 rounded-xl text-amber-800 text-[11px] leading-relaxed flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Teammates should coordinate with Workspace Administrators to update corporate core behavior standards.</span>
                  </div>
                )}
              </div>
            </div>

            {/* COMPETITIVE CASE: Strategic Anchors */}
            <div className="border-2 border-[#1d1d1f] bg-[#fbfbfd] p-6 rounded-2xl space-y-4 md:col-span-2 shadow-xs transition hover:shadow-md">
              <div className="space-y-1">
                <span className="font-bold text-[#1d1d1f] uppercase tracking-wide flex items-center gap-2 text-base">
                  <Compass className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span>COMPETITIVE CASE (STRATEGIC ANCHORS)</span>
                </span>
                <p className="text-[#86868b] text-xs font-medium font-sans">How does this amplify our unique market advantages that competitors cannot match?</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {compass.strategicAnchors.length === 0 ? (
                    <p className="text-neutral-400 text-xs italic">No strategic anchors specified yet.</p>
                  ) : (
                    compass.strategicAnchors.map((anch, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white border border-[#e8e8ed] hover:border-[#1d1d1f] rounded-xl p-3 group transition text-xs shadow-xs">
                        <span className="font-bold text-[#1d1d1f] flex items-center gap-1.5">&bull; {anch}</span>
                        {!isEmployee && (
                          <button
                            onClick={() => handleDeleteAnchor(idx)}
                            className="opacity-0 group-hover:opacity-100 text-[#86868b] hover:text-red-500 p-1 rounded-md transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {!isEmployee ? (
                  <div className="space-y-2.5">
                    <textarea
                      placeholder="Add strategic anchor (e.g. Proprietary distribution channel)..."
                      value={newAnchorItem}
                      onChange={(e) => setNewAnchorItem(e.target.value)}
                      rows={2}
                      className="bg-white border border-[#e8e8ed] focus:border-[#1d1d1f] rounded-xl p-2.5 w-full outline-none text-xs font-medium resize-none shadow-xs"
                    />
                    <button
                      onClick={handleAddAnchor}
                      className="bg-[#1d1d1f] hover:bg-neutral-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center cursor-pointer transition w-full shadow-xs"
                    >
                      Save Strategic Anchor
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/50 border border-amber-100/60 rounded-xl text-amber-800 text-[11px] leading-relaxed flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Competitive advantage anchors are locked for standard employee accounts. View details for strategic guidance.</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Compass graphics */}
          <div className="lg:col-span-4 flex flex-col justify-center items-center p-6 border-t lg:border-t-0 lg:border-l border-[#e8e8ed] select-none">
            <div className="text-center space-y-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#86868b]">ALIGNMENT RADAR</span>
              
              <div className="relative w-44 h-44 my-4 flex items-center justify-center bg-[#f5f5f7] rounded-full border border-[#e8e8ed]">
                <Compass className="w-16 h-16 text-[#1d1d1f] opacity-80" />
                
                {/* Outer coordinate highlights */}
                <div className="absolute top-2.5 text-[9px] font-mono tracking-tight text-[#86868b] uppercase">GOALS</div>
                <div className="absolute bottom-2.5 text-[9px] font-mono tracking-tight text-[#86868b] uppercase">MISSION</div>
                <div className="absolute left-2.5 text-[9px] font-mono tracking-tight text-[#86868b] uppercase rotate-90 origin-center">STRATEGY</div>
                <div className="absolute right-2.5 text-[9px] font-mono tracking-tight text-[#86868b] uppercase -rotate-90 origin-center">CULTURE</div>
              </div>
              
              <h4 className="font-semibold text-sm text-[#1d1d1f]">Decentralized Autonomy</h4>
              <p className="text-[#86868b] text-[11px] max-w-[190px] mx-auto leading-relaxed">
                Use the Clarity Compass to align any candidate proposal or project to ensure complete horizontal brand integration.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
