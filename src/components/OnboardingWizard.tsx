import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Play, 
  CheckCircle2, 
  X,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Compass,
  Laptop
} from 'lucide-react';
import { TeamMember, Playbook } from '../types';

interface OnboardingWizardProps {
  teamMembers: TeamMember[];
  playbooks: Playbook[];
  onUpdateTeam: (updated: TeamMember[]) => void;
  onUpdatePlaybooks: (updated: Playbook[]) => void;
  onClose: () => void;
}

export default function OnboardingWizard({
  teamMembers,
  playbooks,
  onUpdateTeam,
  onUpdatePlaybooks,
  onClose
}: OnboardingWizardProps) {
  const [activeChapter, setActiveChapter] = useState(0);

  const chapters = [
    {
      id: 0,
      title: "1. Operating System Overview",
      duration: "1:45",
      description: "Learn the core philosophy of Mitior OS, offline sandboxes, and structural workflows.",
      videoUrl: "https://www.youtube.com/embed/P6M_E_Z7yvY",
      benefit: "Understand single-view layout boundaries and local cache management."
    },
    {
      id: 1,
      title: "2. Structuring Value Engines",
      duration: "2:10",
      description: "How to connect continuous acquisition channels, process steps, and fulfillment systems.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      benefit: "Master pipeline node triggers, power stage parameters, and playbook attachments."
    },
    {
      id: 2,
      title: "3. Establishing Accountability Canvas",
      duration: "2:40",
      description: "Design clear business positions, assign accountable owners, and map vacant hiring targets.",
      videoUrl: "https://www.youtube.com/embed/P6M_E_Z7yvY",
      benefit: "Eliminate duplicate roles and secure organizational chart hierarchies."
    },
    {
      id: 3,
      title: "4. Executing Sprints & Rhythms",
      duration: "1:55",
      description: "Setup quarterly objectives, monthly task sprints, daily scorecard metrics, and sync keys.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      benefit: "Deploy standard reporting metrics and offline desktop client packaging."
    }
  ];

  const handleCompleteTraining = () => {
    localStorage.setItem('sOS_onboarding_wizard_done', 'true');
    onClose();
  };

  return (
    <div className="bg-white dark:bg-[#1d1d1f] border border-[#e8e8ed] dark:border-[#2d2d2f] rounded-3xl p-6 md:p-8 shadow-xl max-w-4xl mx-auto space-y-6 relative overflow-hidden text-left animate-fade-in font-sans">
      
      {/* Accent Background Ambient */}
      <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-indigo-100/40">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Mitior OS Video Academy
          </div>
          <h2 className="text-xl font-extrabold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight">
            Interactive Onboarding Walkthrough
          </h2>
          <p className="text-xs text-[#86868b] dark:text-[#8e8e93]">
            Absorb the operating core layout lessons below to maximize operational efficiency.
          </p>
        </div>

        <button 
          onClick={onClose}
          className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white p-1 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer"
          title="Dismiss academy player"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Theater Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Responsive Video Player Theater frame */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-neutral-150 dark:border-neutral-800 relative shadow-md group">
            <iframe
              src={chapters[activeChapter].videoUrl}
              title={chapters[activeChapter].title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="bg-[#fbfbfd] dark:bg-[#252526] border border-[#e8e8ed] dark:border-neutral-800 rounded-xl p-3 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <h4 className="font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Core Takeaway lesson:</h4>
              <p className="text-[#86868b] dark:text-[#8e8e93] text-[11px] leading-relaxed">
                {chapters[activeChapter].benefit}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Chapter Checklist Navigation */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider block font-mono">Academy Playlists ({chapters.length} Lectures)</span>
            
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {chapters.map((ch, idx) => {
                const isSelected = activeChapter === idx;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChapter(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                      isSelected 
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-600 dark:border-indigo-500/50 text-indigo-900 dark:text-indigo-300' 
                        : 'bg-white dark:bg-[#252526]/30 border-[#e8e8ed] dark:border-[#2d2d2f] hover:bg-neutral-50 dark:hover:bg-neutral-800/55 text-neutral-800 dark:text-neutral-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center ${isSelected ? 'bg-indigo-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                      <Play className="w-3 h-3 fill-current" />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold block truncate">{ch.title}</span>
                        <span className="text-[9.5px] font-mono text-[#86868b] flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {ch.duration}
                        </span>
                      </div>
                      <p className={`text-[10px] leading-tight ${isSelected ? 'text-[#86868b]' : 'text-neutral-400'}`}>
                        {ch.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10.5px] text-[#86868b] uppercase tracking-wide font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>SOP READY FOR DEPLOYMENT</span>
            </div>
            
            <button
              onClick={handleCompleteTraining}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer hover:scale-103 active:scale-97 transition-all flex items-center gap-1 font-sans shadow-md shadow-indigo-600/10"
            >
              <span>Confirm & Launch OS</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
