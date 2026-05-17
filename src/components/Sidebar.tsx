import React from 'react';
import { TAB_COLORS, TAB_NAMES, type TabId } from '../data/constants';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  hasScriptData: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, hasScriptData }) => {
  return (
    <div className="w-full md:w-64 flex md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-visible pb-2 md:pb-0 sidebar-item">
      {(Object.keys(TAB_NAMES) as TabId[]).map(tabId => {
        const isActive = activeTab === tabId;
        const isStudioDisabled = tabId === 'studio' && !hasScriptData && !isActive;
        const colors = TAB_COLORS[tabId];
        const tabInfo = TAB_NAMES[tabId];

        return (
          <button
            key={tabId}
            onClick={() => onTabChange(tabId)}
            disabled={isStudioDisabled}
            className={`p-4 rounded-xl text-left border transition-all shrink-0 min-w-[200px] md:min-w-0 ${
              isActive
                ? `${colors.bg} ${colors.border} ${colors.text} ${colors.shadow} active`
                : `bg-transparent border-transparent text-orange-500/50 hover:bg-[#1a1408] hover:text-orange-200 ${isStudioDisabled ? 'opacity-30 cursor-not-allowed' : ''}`
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <i className={`${tabInfo.icon} text-lg`}></i>
              <span className="font-bold text-sm">{tabInfo.name}</span>
            </div>
            <p className="text-[10px] opacity-60">{tabInfo.desc}</p>
          </button>
        );
      })}
    </div>
  );
};

export default Sidebar;