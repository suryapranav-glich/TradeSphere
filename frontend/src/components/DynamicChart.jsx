import React, { useRef, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Area
} from 'recharts';
import html2canvas from 'html2canvas';
import { Download, FileDown, FileText, Code } from 'lucide-react';

const COLORS = ["#6c63ff", "#00d4ff", "#ff6b6b", "#ffd93d", "#6bcb77"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const finalLabel = (label !== undefined && label !== "") ? label : payload[0].payload.name || payload[0].payload.category || label;
    return (
      <div className="recharts-default-tooltip p-4" style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid rgba(108, 99, 255, 0.3)', padding: '12px', borderRadius: '8px', backdropFilter: 'blur(10px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <p className="font-medium text-white mb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>{`${finalLabel}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color || COLORS[index % COLORS.length], margin: '4px 0', fontSize: '13px', display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
            <span>{entry.name}:</span>
            <span style={{ fontWeight: '600' }}>{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DynamicChart = ({ chartData, loading, activeQuery }) => {
  const chartRef = useRef(null);
  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [showSQL, setShowSQL] = useState(false);

  if (loading) {
    return (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <br />
        <p className="animate-pulse">Generating Insights...</p>
      </div>
    );
  }

  if (!chartData || !chartData.data) {
    return (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <p>Awaiting Query</p>
      </div>
    );
  }

  if (chartData.type?.toLowerCase() === 'none') {
    return (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
         <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
         </div>
         <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Strategic Analysis Active</h3>
         <p style={{ maxWidth: '300px', textAlign: 'center' }}>This prompt does not require a visual data graph. Please refer to the AI Marketing Insights panel for detailed strategic analysis.</p>
      </div>
    );
  }

  if (chartData.data.length === 0) {
    return (
      <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No metric data matched this query.
      </div>
    );
  }

  const { type, data, title, series, xKey } = chartData;

  const yKeys = series ? series.map(s => s.key) : Object.keys(data[0] || {}).filter(k => k !== xKey && typeof data[0][k] === 'number');

  // Comparison Check
  const isComparisonQuery = activeQuery && (activeQuery.toLowerCase().includes('compare') || activeQuery.toLowerCase().includes(' vs '));
  const showComparisonWarning = isComparisonQuery && yKeys.length < 2;

  const handleDownloadImage = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: '#09090b', scale: 2 });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${title || 'visualisation'}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error("Failed to download image", err);
    }
  };

  const handleDownloadCSV = () => {
    if (!data || data.length === 0) return;
    const csvKeys = Object.keys(data[0]);
    const csvContent = [
      csvKeys.join(','),
      ...data.map(row => csvKeys.map(k => `"${row[k]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title || 'data'}.csv`);
    link.click();
  };

  const handleSummarize = async () => {
    if (!data || data.length === 0) return;
    try {
      setSummarizing(true);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_BASE}/api/insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'Summarize this visual data and describe what key action can be taken from it.', data_context: JSON.stringify(data.slice(0, 15)) })
      });
      const result = await res.json();
      setSummary(result.recommendation || result.insights?.join(' ') || "Summary generated based on current visualization.");
    } catch (err) {
      setSummary("Analytics engine offline. Unable to generate summary at this moment.");
    } finally {
      setSummarizing(false);
    }
  };

  const renderChart = () => {
    if (showComparisonWarning) {
      return (
        <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ff6b6b', background: 'rgba(255, 107, 107, 0.05)', borderRadius: '12px', border: '1px dashed rgba(255, 107, 107, 0.3)' }}>
          <span style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</span>
          <p style={{ fontWeight: '600', marginBottom: '4px' }}>Could not separate data series.</p>
          <p style={{ fontSize: '13px', opacity: 0.8 }}>Please rephrase your query for a clearer comparison.</p>
        </div>
      );
    }

    switch (type?.toLowerCase()) {
      case 'pie':
        const pieValueKey = yKeys[0] || keys[1];
        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={110}
                fill="#8884d8"
                dataKey={pieValueKey}
                nameKey={xKey}
                stroke="var(--bg-primary)"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" align="center" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey={xKey} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" align="center" wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px' }} />
              {series ? series.map((s, i) => (
                <Line 
                  key={s.key} 
                  name={s.label}
                  type="monotone" 
                  dataKey={s.key} 
                  stroke={s.color} 
                  strokeWidth={3}
                  dot={{ r: 4, fill: s.color, strokeWidth: 2, stroke: 'var(--bg-primary)' }}
                  activeDot={{ r: 8, strokeWidth: 0 }} 
                />
              )) : yKeys.map((key, i) => (
                <Line 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={COLORS[i % COLORS.length]} 
                  strokeWidth={3}
                  dot={{ r: 4, fill: COLORS[i % COLORS.length], strokeWidth: 2, stroke: 'var(--bg-primary)' }}
                  activeDot={{ r: 8, strokeWidth: 0 }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'funnel': 
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8' }} />
              <YAxis dataKey={xKey} type="category" stroke="#64748b" tick={{ fill: '#94a3b8' }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" align="center" />
              {series ? series.map((s, i) => (
                <Bar key={s.key} name={s.label} dataKey={s.key} fill={s.color} radius={[0, 4, 4, 0]} barSize={40} />
              )) : yKeys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[0, 4, 4, 0]} barSize={40} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'table':
        return (
          <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)' }}>
                  {keys.map(k => (
                    <th key={k} style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: '600', position: 'sticky', top: 0, background: 'var(--bg-tertiary)' }}>{k.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)', background: i % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                    {keys.map(k => (
                      <td key={k} style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{typeof row[k] === 'number' ? row[k].toLocaleString() : row[k]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'bar':
      default:
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey={xKey} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Legend verticalAlign="top" align="center" wrapperStyle={{ paddingBottom: '20px' }} />
              {series ? series.map((s, i) => (
                <Bar 
                  key={s.key} 
                  name={s.label}
                  dataKey={s.key} 
                  fill={s.color} 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                />
              )) : yKeys.map((key, i) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  fill={COLORS[i % COLORS.length]} 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chart-header" style={{ marginBottom: '16px' }}>
        <h3 className="chart-title text-gradient">{title || 'Data Visualization'}</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
           {chartData?.sql && (
             <button onClick={() => setShowSQL(!showSQL)} className="action-btn" title="View SQL Data">
                <Code size={14} /> SQL
             </button>
           )}
           <button onClick={handleSummarize} className="action-btn ai" disabled={summarizing}>
              {summarizing ? <div style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <FileText size={14} />}
              AI Summary
           </button>
           <button onClick={handleDownloadImage} className="action-btn" title="Download Chart">
              <Download size={14} />
           </button>
           <button onClick={handleDownloadCSV} className="action-btn" title="Download CSV Data">
              <FileDown size={14} />
           </button>
        </div>
      </div>
      
      {summary && (
        <div className="animate-fade-in" style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', borderLeft: '3px solid var(--accent-secondary)', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
           <strong>Chart Insight:</strong> {summary}
        </div>
      )}

      {showSQL && chartData?.sql && (
        <div className="animate-fade-in" style={{ padding: '12px 16px', background: '#000000', border: '1px solid var(--glass-border)', borderRadius: '6px', marginBottom: '20px', fontFamily: 'monospace', fontSize: '14px', color: '#10b981', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
          {chartData.sql.trim()}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, paddingBottom: '16px' }} ref={chartRef}>
        {renderChart()}
      </div>
    </div>
  );
};

export default DynamicChart;
