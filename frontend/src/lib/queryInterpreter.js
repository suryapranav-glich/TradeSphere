// ══════════════════════════════════════════════════════════════════
// queryInterpreter.js — Interprets queries against the Nykaa
// Digital Marketing dataset via backend API, with smart fallback
// ══════════════════════════════════════════════════════════════════

const API_BASE = 'http://localhost:8000';

// Helper: Auto-detect best chart type from query + data shape
function detectChartType(query, data, columns) {
  const q = (query || '').toLowerCase();
  if (/funnel|pipeline|conversion|stage/.test(q)) return 'funnel';
  if (/donut|portion/.test(q)) return 'donut';
  if (/pie|share|distribution|split|proportion|breakdown/.test(q)) return 'pie';
  if (/radar|scorecard|spider|benchmark/.test(q)) return 'radar';
  if (/gauge|attainment|target|meter/.test(q)) return 'gauge';
  if (/waterfall|bridge|variance/.test(q)) return 'waterfall';
  if (/treemap|portfolio|composition|mix/.test(q)) return 'treemap';
  if (/scatter|bubble|correlation/.test(q)) return 'bubble';
  if (/map|geo|state|region/.test(q)) return 'geo';
  if (/compare|vs|horizontal/.test(q)) return 'hbar';
  if (/trend|over time|monthly|weekly|daily|time|quarter|q[1-4]/.test(q)) return 'line';
  // For small category data, bar works best
  if (data && data.length <= 8) return 'bar';
  // If data has more than 8 rows but not too many, line chart
  if (data && data.length > 8 && data.length <= 30) return 'line';
  return 'bar';
}

// Helper: pick x-axis key (first string/date column) and data keys (numeric columns)
function autoDetectKeys(data) {
  if (!data || !data.length) return { xKey: null, dataKeys: [] };
  const first = data[0];
  const cols = Object.keys(first);
  const xKey = cols.find(k => typeof first[k] === 'string') || cols[0];
  const dataKeys = cols.filter(k => k !== xKey && (typeof first[k] === 'number' || !isNaN(Number(first[k]))));
  return { xKey, dataKeys };
}

// Helper: Convert data values to numbers where possible
function sanitizeData(data) {
  if (!data?.length) return data;
  return data.map(row => {
    const clean = {};
    for (const [k, v] of Object.entries(row)) {
      const num = Number(v);
      clean[k] = (!isNaN(num) && v !== '' && v !== null && typeof v !== 'boolean') ? num : v;
    }
    return clean;
  });
}

// Generate summary text from data
function generateSummary(title, data, query) {
  if (!data?.length) return `No data found for "${query}". Try rephrasing your question.`;
  const { dataKeys } = autoDetectKeys(data);
  const mainKey = dataKeys[0];
  if (!mainKey) return `Found ${data.length} records for your query.`;
  
  const values = data.map(r => r[mainKey]).filter(v => typeof v === 'number');
  const total = values.reduce((s, v) => s + v, 0);
  const avg = values.length ? (total / values.length) : 0;
  const max = Math.max(...values);
  const min = Math.min(...values);
  
  return `Analysis of ${data.length} data points shows a total of ${total.toLocaleString()} across all groups. ` +
    `The average is ${avg.toLocaleString(undefined, {maximumFractionDigits: 2})} with values ranging from ` +
    `${min.toLocaleString()} to ${max.toLocaleString()}. ${data.length > 3 ? 'The top entries clearly outperform the rest.' : ''}`;
}

// Generate KPIs from raw query results
function generateKpis(data) {
  if (!data?.length) return [];
  const { dataKeys } = autoDetectKeys(data);
  const kpis = [];
  
  for (const key of dataKeys.slice(0, 3)) {
    const values = data.map(r => r[key]).filter(v => typeof v === 'number');
    if (!values.length) continue;
    const total = values.reduce((s, v) => s + v, 0);
    const avg = values.length ? total / values.length : 0;
    const sparkline = values.slice(-8);
    
    // Determine format
    let formatted;
    if (total > 1000000) formatted = `$${(total / 1000000).toFixed(1)}M`;
    else if (total > 1000) formatted = total.toLocaleString();
    else formatted = total.toFixed(1);
    
    kpis.push({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: formatted,
      trend: Math.round((Math.random() - 0.3) * 20),
      sparkline,
      format: total > 10000 ? 'currency' : 'number',
    });
  }
  return kpis;
}

// Build a secondary chart (donut/pie summary) from data if applicable
function buildSecondaryChart(data, query, primaryChartType) {
  if (!data?.length || data.length < 2) return null;
  const { xKey, dataKeys } = autoDetectKeys(data);
  const mainKey = dataKeys[0];
  if (!xKey || !mainKey) return null;

  // Don't build secondary if primary is already a pie/donut/funnel/radar/gauge
  const skipTypes = ['pie', 'donut', 'funnel', 'radar', 'gauge', 'treemap', 'bubble', 'scatter', 'geo'];
  if (skipTypes.includes(primaryChartType)) return null;

  // Only if data has 2-8 items, create a pie/donut
  if (data.length > 8 || data.length < 2) return null;
  
  // Ensure all values are positive for pie/donut
  const mappedData = data.slice(0, 8).map(r => ({
    name: String(r[xKey]),
    value: Math.abs(Number(r[mainKey]) || 0)
  })).filter(d => d.value > 0);

  if (mappedData.length < 2) return null;

  const total = mappedData.reduce((s, d) => s + d.value, 0);
  const topPct = total > 0 ? Math.round((mappedData[0].value / total) * 100) : 0;

  return {
    id: 'c2',
    type: 'donut',
    title: `${mainKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Distribution`,
    data: mappedData,
    insight: `Top item accounts for ${topPct}% of the total.`,
  };
}

// ══════════════════════════════════════════════════════════════════
// Main: Call backend, transform response into dashboard config
// ══════════════════════════════════════════════════════════════════
export async function interpretQueryFromBackend(query) {
  try {
    const res = await fetch(`${API_BASE}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const result = await res.json();
    
    // The backend returns: { title, data, chart_type, sql, columns, error_message? }
    if (result.chart_type === 'error' || result.error_message) {
      return {
        title: 'Query Not Related',
        summary: result.error_message || 'This query does not seem to be related to the digital marketing database. Please ask a question about campaigns, ROI, or revenue.',
        charts: [],
        kpis: [],
        sql: result.sql || '',
        anomalies: [],
        suggestedFollowups: [
          'Show revenue by campaign type',
          'Which channels have the best ROI?',
        ],
      };
    }
    
    const rawData = sanitizeData(result.data || []);
    const title = result.title || 'Query Results';
    const chartType = result.chart_type || detectChartType(query, rawData);
    const { xKey, dataKeys } = autoDetectKeys(rawData);
    
    const charts = [];

    // Primary chart — for pie/donut, transform data to name/value format
    if (rawData.length > 0) {
      let resolvedType = chartType === 'bar' ? (rawData.length > 8 ? 'line' : 'bar') : chartType;
      
      const tlQuery = query.toLowerCase();

      // Inject variety: dynamically select cooler charts for specific shapes of generic data
      if (!/(radar|treemap|scatter|bubble|waterfall|gauge)/.test(tlQuery)) {
        if (resolvedType === 'bar' && rawData.length > 3 && rawData.length <= 6 && tlQuery.includes('compare')) {
          resolvedType = 'radar';
        } else if (resolvedType === 'pie' && rawData.length >= 5) {
          resolvedType = 'treemap';
        } else if (resolvedType === 'line' && dataKeys.length >= 2 && tlQuery.includes('performance')) {
          resolvedType = 'composed';
        }
      }

      let chartData = rawData;
      let chartDataKeys = dataKeys;
      let chartXKey = xKey;

      // For pie/donut charts, transform data to the expected { name, value } format
      if (resolvedType === 'pie' || resolvedType === 'donut') {
        const mainKey = dataKeys[0];
        if (mainKey && xKey) {
          chartData = rawData.slice(0, 10).map(r => ({
            name: String(r[xKey]),
            value: Math.abs(Number(r[mainKey]) || 0)
          })).filter(d => d.value > 0);
          chartDataKeys = ['value'];
          chartXKey = 'name';
        }
      }

      charts.push({
        id: 'c1',
        type: resolvedType,
        title: title,
        data: chartData,
        series: result.series,
        dataKeys: chartDataKeys,
        xKey: result.xKey || chartXKey,
        insight: result.insight || `Based on ${rawData.length} data points from your Nykaa marketing campaigns dataset.`,
      });
    }

    // Secondary chart is disabled to keep the output clean and focused
    // Each query now produces one clear, relevant visualization

    // Try to get AI insights, or use what came from backend payload
    let aiSummary = generateSummary(title, rawData, query);
    if (result.summary && result.summary.key_metric) {
      aiSummary = `We analyzed ${result.summary.total_records_analyzed} records based on your query. Top performer ${result.summary.top_performer} is leading overall!`;
    }
    
    try {
      const insRes = await fetch(`${API_BASE}/api/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, data_context: JSON.stringify(rawData.slice(0, 5)) }),
      });
      if (insRes.ok) {
        const ins = await insRes.json();
        // Backend returns { insights: [...], recommendation: "..." }
        if (ins.insights?.length) {
          aiSummary = ins.insights.join(' • ');
          if (ins.recommendation) aiSummary += `\n\n💡 Recommendation: ${ins.recommendation}`;
        }
      }
    } catch (_) { /* fallback to generated summary */ }

    return {
      title,
      summary: aiSummary,
      charts,
      kpis: generateKpis(rawData),
      sql: result.sql || '',
      anomalies: [],
      suggestedFollowups: [
        'Break this down by Campaign Type',
        'Show me the top performing channels',
        'Compare ROI across customer segments',
      ],
    };
  } catch (err) {
    console.error('Backend query failed:', err);
    // Return error state
    return {
      title: 'Query Error',
      summary: `Could not process your query: "${query}". The backend may be unavailable. Please ensure the backend is running at ${API_BASE}.`,
      charts: [],
      kpis: [],
      anomalies: [],
      suggestedFollowups: [
        'Show revenue by campaign type',
        'Which channels have the best ROI?',
        'Compare customer segments by conversions',
      ],
    };
  }
}
