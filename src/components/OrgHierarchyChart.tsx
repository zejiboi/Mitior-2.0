import React, { useState } from 'react';
import { TeamMember, Playbook } from '../types';
import { Award, GitBranch, ArrowDown, ChevronDown, ChevronUp, User, Users, Compass } from 'lucide-react';

interface TreeNode {
  member: TeamMember;
  children: TreeNode[];
}

interface OrgHierarchyChartProps {
  teamMembers: TeamMember[];
  playbooks: Playbook[];
  onSelectMember?: (memberId: string) => void;
}

// Helper to sanitize and normalize manager reference names
const cleanName = (text: string) => {
  return (text || '').toLowerCase().replace(/\s*\(you\)\s*/g, '').trim();
};

export default function OrgHierarchyChart({ teamMembers, playbooks, onSelectMember }: OrgHierarchyChartProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Group team members recursively to build org tree
  const buildTree = (): TreeNode[] => {
    const memberNames = new Set(teamMembers.map(m => cleanName(m.name)));
    
    // Root nodes are those who either:
    // 1. are explicitly set as Founder
    // 2. have manager as "Board" or empty
    // 3. have a manager name that does not exist in the team roster names (e.g. externals)
    const roots = teamMembers.filter(m => 
      m.isFounder || 
      !m.manager || 
      m.manager.toLowerCase() === 'board' || 
      !memberNames.has(cleanName(m.manager))
    );

    // If no roots detected, fallback to the first element
    if (roots.length === 0 && teamMembers.length > 0) {
      roots.push(teamMembers[0]);
    }

    const constructNode = (member: TeamMember): TreeNode => {
      const curClean = cleanName(member.name);
      
      // Children have their manager field referring to current member name
      const children = teamMembers.filter(m => 
        m.id !== member.id && 
        cleanName(m.manager) === curClean
      );

      return {
        member,
        children: children.map(child => constructNode(child))
      };
    };

    return roots.map(r => constructNode(r));
  };

  const roots = buildTree();

  // Highlight action callback
  const handleNodeClick = (memberId: string) => {
    setHighlightedId(memberId);
    if (onSelectMember) {
      onSelectMember(memberId);
    }
    // Remove highlight after animation
    setTimeout(() => {
      setHighlightedId(null);
    }, 1500);
  };

  // Luxury profile avatar allocator 
  const getProfilePhoto = (id: string, name: string): string => {
    const member = teamMembers.find(m => m.id === id);
    if (member && member.photoUrl) {
      return member.photoUrl;
    }
    const lowered = name.toLowerCase();
    if (lowered.includes('ryan') || id === 'tm-owner' || id === 'tm-1') {
      return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100&q=80';
    }
    if (lowered.includes('christina') || lowered.includes('crews') || id === 'tm-2') {
      return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&h=100&q=80';
    }
    if (lowered.includes('sarah') || lowered.includes('connor') || id === 'tm-3' || lowered.includes('greg') || lowered.includes('karli')) {
      return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80';
    }
    if (lowered.includes('thomas') || lowered.includes('neo') || lowered.includes('frank') || id === 'tm-4' || lowered.includes('betty') || lowered.includes('white')) {
      return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&h=100&q=80';
    }
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80';
  };

  // Recursive tree renderer
  const renderNode = (node: TreeNode, isLast: boolean, depth: number = 0) => {
    const { member, children } = node;
    const isHighlighted = highlightedId === member.id;
    const ownedPlaybooks = playbooks.filter(p => p.ownerId === member.id);

    return (
      <div key={member.id} className="flex flex-col items-center relative z-10 shrink-0">
        
        {/* Node Element */}
        <div 
          onClick={() => handleNodeClick(member.id)}
          className={`relative group flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 cursor-pointer w-[180px] bg-white text-neutral-900 shadow-sm ${
            isHighlighted 
              ? 'border-neutral-950 scale-105 ring-4 ring-neutral-950/5' 
              : 'border-[#e8e8ed] hover:border-neutral-900 hover:shadow-md hover:-translate-y-0.5'
          } ${member.isFounder ? 'ring-2 ring-amber-400/20' : ''}`}
        >
          {/* Avatar frame */}
          <div className="relative">
            <img 
              src={getProfilePhoto(member.id, member.name)} 
              alt={member.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-[#e8e8ed] shadow-2xs"
            />
            {member.isFounder && (
              <span className="absolute -top-1 -right-1 bg-amber-400 p-0.5 rounded-full text-slate-950 border border-white">
                <Award className="w-2.5 h-2.5 text-slate-950" />
              </span>
            )}
          </div>

          <div className="text-center mt-2 w-full">
            <h4 className="text-[11px] font-bold text-[#1d1d1f] truncate leading-tight font-sans">
              {member.name.replace(/\(you\)/gi, '').trim()}
            </h4>
            <p className="text-[9px] text-[#86868b] truncate mt-0.5 font-medium leading-none font-sans">
              {member.jobTitle}
            </p>
          </div>

          {/* Quick info bullets summary badge */}
          <div className="flex gap-1.5 mt-2 bg-neutral-50 px-2 py-1 rounded-lg w-full justify-center">
            <span className="text-[8px] font-bold text-[#1d1d1f] flex items-center gap-0.5 font-sans">
              📋 {member.accountabilities.length} CABs
            </span>
            {ownedPlaybooks.length > 0 && (
              <span className="text-[8px] font-bold text-[#86868b] font-sans">
                • 📖 {ownedPlaybooks.length} SOPs
              </span>
            )}
          </div>
          
          {/* Decorative indicator lines */}
          <div className="absolute -bottom-1 text-[8px] font-bold font-sans bg-[#1d1d1f] text-white opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded transition pointer-events-none whitespace-nowrap">
            Focus details
          </div>
        </div>

        {/* Child connector & Subtree rendering */}
        {children.length > 0 && (
          <div className="flex flex-col items-center w-full mt-5 relative">
            {/* Draw single vertical connector line down from parent to horizontal rail */}
            <div className="absolute top-[-20px] left-1/2 -ml-px w-[1.5px] h-5 bg-[#e8e8ed]" />

            {/* Subtree Container Row */}
            <div className="flex gap-6 justify-center pt-3 relative">
              
              {/* Draw horizontal railway connecting line that spans children */}
              {children.length > 1 && (
                <div className="absolute top-0 left-[90px] right-[90px] h-[1.5px] bg-[#e8e8ed]" />
              )}

              {/* Recursive child branch rendering */}
              {children.map((childNode, index) => {
                const isFirstChild = index === 0;
                const isLastChild = index === children.length - 1;

                return (
                  <div key={childNode.member.id} className="relative flex flex-col items-center">
                    {/* Draw child's vertical drop line down to the child box */}
                    <div className="absolute top-[-12px] left-1/2 -ml-px w-[1.5px] h-3 bg-[#e8e8ed]" />
                    {renderNode(childNode, isLastChild, depth + 1)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#e8e8ed] rounded-2xl shadow-sm transition-all overflow-hidden font-sans">
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-6 py-4 border-b border-[#f5f5f7] bg-[#fbfbfd] flex items-center justify-between cursor-pointer group select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="bg-[#1d1d1f] text-white p-1.5 rounded-lg">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1d1d1f] text-sm font-sans">
              Autogenerated Reporting Flowchart
            </h3>
            <p className="text-[11px] text-[#86868b] mt-0.5 font-medium font-sans">
              Live corporate tree structured in real-time. Click any node to drill into their accountability scorecard nodes.
            </p>
          </div>
        </div>
        <button className="text-[#86868b] group-hover:text-[#1d1d1f] transition">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-8 overflow-x-auto select-none bg-[#fbfbfd]/40" id="org-hierarchy-viewport">
          <div className="min-w-[650px] flex flex-col items-center justify-center py-4">
            
            {roots.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-neutral-500 font-medium text-xs font-sans">No roster setup yet to construct flow chart.</p>
              </div>
            ) : (
              <div className="flex gap-16 justify-center w-full">
                {roots.map((rootNode, idx) => (
                  <div key={rootNode.member.id} className="flex flex-col items-center">
                    {renderNode(rootNode, idx === roots.length - 1)}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-8 border border-[#e8e8ed] bg-white rounded-full px-3.5 py-1 text-[10px] text-[#86868b] font-medium font-sans">
              <Compass className="w-3.5 h-3.5" />
              <span>Interactive View: Nodes match grid rows dynamically. No custom drawing required.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
