import React from 'react';
import { Lightbulb, CheckCircle, ArrowRightCircle } from 'lucide-react';

const Insights = ({ insights, recommendation, loading }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px' }}>
         <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '8px', borderRadius: '8px', color: 'var(--warning-color)' }}>
            <Lightbulb size={20} />
         </div>
         <h3 style={{ fontSize: '18px', fontWeight: '600' }}>AI Marketing Insights</h3>
      </div>
      
      {loading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1,2,3,4].map(i => (
             <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: 16, height: 16, background: 'var(--glass-border)', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                <div style={{ height: 16, background: 'var(--glass-border)', borderRadius: 4, width: '100%', animation: 'pulse 1s infinite' }}></div>
             </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--accent-primary)' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Key Discoveries</h4>
            {insights.length > 0 ? insights.map((insight, idx) => (
               <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.5' }}>
                  <CheckCircle size={16} color="var(--success-color)" style={{ marginTop: '4px', flexShrink: 0 }} />
                  <span>{insight}</span>
               </div>
            )) : (
              <p style={{ color: 'var(--text-muted)' }}>Awaiting your first query to analyze marketing data...</p>
            )}
          </div>
          
          <div style={{ marginTop: 'auto', background: 'linear-gradient(145deg, var(--bg-tertiary), rgba(59,130,246,0.1))', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
             <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '600', color: 'var(--accent-secondary)', marginBottom: '12px' }}>
                <ArrowRightCircle size={18} />
                Optimization Recommendation
             </h4>
             <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
               {recommendation}
             </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insights;
