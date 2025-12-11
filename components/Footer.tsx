import React from 'react';
import { Share2, Mail } from 'lucide-react';

interface FooterProps {
  onShare: () => void;
}

const Footer: React.FC<FooterProps> = ({ onShare }) => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800 p-4 text-center z-20 flex flex-col items-center gap-2">
      <div className="text-sm text-slate-400 font-mono">
        (C) Noam Gold AI 2025
      </div>
      
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <a 
          href="mailto:gold.noam@gmail.com" 
          className="flex items-center gap-1 hover:text-green-400 transition-colors"
        >
          <Mail size={12} />
          Send Feedback: gold.noam@gmail.com
        </a>
      </div>

      <button 
        onClick={onShare}
        className="mt-2 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-green-900/20"
      >
        <Share2 size={16} />
        שתף משחק
      </button>
    </footer>
  );
};

export default Footer;