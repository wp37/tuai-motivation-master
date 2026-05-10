import React from 'react';
import { TAB_COLORS, type TabId } from '../data/constants';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  hasScriptData: boolean;
}

const TABS: { id: TabId; icon: string; title: string; subtitle: string }[] = [
  { id: 'spy', icon: 'fa-solid fa-binoculars', title: '1. INSIGHT HUNTER', subtitle: 'Discover Viral Secrets' },
  { id: 'script', icon: 'fa-solid fa-feather-alt', title: '2. SCRIPT FORGE', subtitle: 'Craft The Story' },
  { id: 'studio', icon: 'fa-solid fa-film', title: '3. VISION STUDIO', subtitle: 'Visual Creation' },
  { id: 'seo', icon: 'fa-solid fa-rocket', title: '4. SEO IGNITER', subtitle: 'Viral Optimization' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, hasScriptData }) => {
  return (
    <div className="w-full md:w-64 flex md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
      {TABS.map(tab => {
        const isActive = activeTab === tab.id;
        const isStudioDisabled = tab.id === 'studio' && !hasScriptData && !isActive;
        const colors = TAB_COLORS[tab.id];

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            disabled={isStudioDisabled}
            className={`p-4 rounded-xl text-left border transition-all shrink-0 min-w-[200px] md:min-w-0 ${
              isActive
                ? `${colors.bg} ${colors.border} ${colors.text} ${colors.shadow}`
                : `bg-transparent border-transparent text-orange-500/50 hover:bg-[#1a1408] hover:text-orange-200 ${isStudioDisabled ? 'opacity-30 cursor-not-allowed' : ''}`
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <i className={`${tab.icon} text-lg`}></i>
              <span className="font-bold text-sm">{tab.title}</span>
            </div>
            <p className="text-[10px] opacity-60">{tab.subtitle}</p>
          </button>
        );
      })}
    </div>
  );
};

export default Sidebar;