import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CitationEntity } from '../../types';
import { ExternalLink, AlertTriangle, FileText, ShieldAlert } from 'lucide-react';

interface CitationPillProps {
  citation: CitationEntity;
}

export const CitationPill: React.FC<CitationPillProps> = ({ citation }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (citation.url_path) {
      navigate(citation.url_path);
    }
  };

  const icons = {
    INCIDENT: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
    WORKFLOW: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />,
    RECORD: <FileText className="w-3.5 h-3.5 text-indigo-400" />,
    POLICY: <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />,
  }[citation.type] || <FileText className="w-3.5 h-3.5" />;

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-900 border border-slate-700/80 hover:border-indigo-500 hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-all duration-200 shadow-sm"
    >
      {icons}
      <span className="font-semibold text-slate-200">[{citation.id}]</span>
      <span className="truncate max-w-[140px] text-slate-400">{citation.title}</span>
      {citation.financial_usd !== undefined && citation.financial_usd > 0 && (
        <span className="text-emerald-400 font-bold ml-0.5">
          ${citation.financial_usd.toLocaleString()}
        </span>
      )}
      <ExternalLink className="w-3 h-3 text-slate-500 ml-0.5" />
    </button>
  );
};
