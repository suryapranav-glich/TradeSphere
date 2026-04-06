import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, X } from 'lucide-react';

export const AiSummaryCard = ({ text, subtext }) => {
    const [typedText, setTypedText] = useState("");
    
    useEffect(() => {
        let index = -1;
        setTypedText("");
        const interval = setInterval(() => {
            if (index < text.length - 1) {
                index++;
                setTypedText(prev => prev + text.charAt(index));
            } else {
                clearInterval(interval);
            }
        }, 15);
        return () => clearInterval(interval);
    }, [text]);

    return (
        <div className="glass-panel p-6 border-l-[3px] border-l-[var(--color-primary)] col-span-full relative">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-[rgba(79,158,255,0.1)] rounded-xl">
                    <Sparkles className="w-6 h-6 text-[var(--color-primary)] drop-shadow-[0_0_5px_var(--color-primary)]" />
                </div>
                <div className="flex-grow">
                    <div className="inline-block px-2 py-0.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded mb-2 uppercase tracking-wider">
                        AI Analysis
                    </div>
                    <p className="text-[15px] leading-relaxed text-[var(--color-text)] min-h-[44px]">
                        {typedText}<span className="inline-block w-1.5 h-3 ml-1 bg-[var(--color-text)] animate-[blink_0.8s_infinite]"></span>
                    </p>
                    {subtext && <p className="text-sm mt-3 text-[var(--color-muted)] italic">{subtext}</p>}
                </div>
            </div>
            
            <div className="mt-5 flex flex-wrap gap-2">
                {["Break this down by product category", "Show me the trend for the top region", "Compare this to last year"].map(chip => (
                    <button key={chip} className="px-3 py-1.5 rounded-full glass-panel text-xs text-[var(--color-primary)] hover:bg-[rgba(79,158,255,0.1)] transition-colors">
                        {chip}
                    </button>
                ))}
            </div>
        </div>
    );
};

export const AnomalyAlert = ({ anomaly, onDismiss }) => {
    return (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ type: "spring" }}
             className={`glass-panel p-4 col-span-full flex justify-between items-center ${anomaly.severity === 'critical' ? 'border-l-[4px] border-l-[var(--color-danger)] shadow-[0_0_15px_rgba(248,113,113,0.3)] animate-pulse' : 'border-l-[4px] border-l-[var(--color-warning)]'}`}
        >
            <div className="flex items-center gap-3">
                <AlertCircle className={`w-5 h-5 ${anomaly.severity === 'critical' ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]'}`} />
                <span className="text-sm font-medium">{anomaly.message}</span>
            </div>
            <button onClick={onDismiss} className="text-[var(--color-muted)] hover:text-white p-1">
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};
