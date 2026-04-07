"""
main.py  —  QueryIQ FastAPI backend
────────────────────────────────────
Fixes applied:
  • Comparison query interceptor: resolves exact DB Campaign_Type labels,
    builds proper CASE WHEN pivot with uniquely-aliased columns
  • Gemini prompt now injects real Campaign_Type values so model never
    hallucinates 'Influencer Marketing' etc.
  • _deduplicate_columns guards against any remaining duplicate aliases
  • All other original logic preserved
"""

import io
import json
import os
import re
import sqlite3
from typing import Any, Dict, List, Optional

import google.generativeai as genai
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

# ── Gemini setup ───────────────────────────────────────────────────────────────
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

SQL_MODEL     = "gemini-2.0-flash"
CHAT_MODEL    = "gemini-2.0-flash"
INSIGHT_MODEL = "gemini-2.0-flash"

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "marketing_campaigns.db"
COLORS  = ["#6c63ff", "#00d4ff", "#ff6b6b", "#ffd93d", "#6bcb77", "#ff922b"]

# ── Auto-generate DB on startup if missing (for Render deployment) ─────────────
def _ensure_database() -> None:
    """Build the SQLite DB from the committed CSV if the campaigns table is absent or empty."""
    table_ok = False
    if os.path.exists(DB_PATH):
        try:
            conn = sqlite3.connect(DB_PATH)
            cur  = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM campaigns LIMIT 1")
            count = cur.fetchone()[0]
            conn.close()
            if count > 0:
                print(f"[DB] campaigns table ready — {count} rows.")
                table_ok = True
        except Exception:
            print("[DB] DB file exists but campaigns table missing/empty — regenerating...")

    if table_ok:
        return

    print("[DB] Generating database from CSV...")
    # Search for the CSV relative to this file's location and CWD
    this_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(this_dir, "..", "Nykaa_Digital_Marketing_Clean.csv.csv"),
        os.path.join(this_dir, "..", "Nykaa_Digital_Marketing_Clean.csv"),
        os.path.join(this_dir, "Nykaa_Digital_Marketing_Clean.csv.csv"),
        "../Nykaa_Digital_Marketing_Clean.csv.csv",
        "Nykaa_Digital_Marketing_Clean.csv.csv",
    ]
    csv_path = next((os.path.abspath(c) for c in candidates if os.path.exists(c)), None)
    if not csv_path:
        print("[DB] WARNING: CSV not found — backend starts without data.")
        print(f"[DB] Searched: {[os.path.abspath(c) for c in candidates]}")
        return
    print(f"[DB] Found CSV at: {csv_path}")
    try:
        from generate_data import ingest_real_data
        ingest_real_data(csv_filename=csv_path)
        print("[DB] Database generated successfully!")
    except Exception as exc:
        print(f"[DB] ERROR generating database: {exc}")

_ensure_database()


MONTH_MAP = {
    "january": "01", "february": "02", "march": "03", "april": "04",
    "may": "05", "june": "06", "july": "07", "august": "08",
    "september": "09", "october": "10", "november": "11", "december": "12",
    "jan": "01", "feb": "02", "mar": "03", "apr": "04",
    "jun": "06", "jul": "07", "aug": "08", "sep": "09",
    "oct": "10", "nov": "11", "dec": "12",
}

QUARTER_MONTHS = {
    1: ["01", "02", "03"],
    2: ["04", "05", "06"],
    3: ["07", "08", "09"],
    4: ["10", "11", "12"],
}

# Exact Campaign_Type labels that exist in the DB
# Used in the Gemini prompt AND the local comparison interceptor
CAMPAIGN_TYPE_LABELS = ["Influencer", "Paid Ads", "Social Media", "Email", "SEO"]

# Keyword → exact DB label mapping for the comparison interceptor
CAMPAIGN_TYPE_MAP = {
    "influencer marketing": "Influencer",
    "influencer": "Influencer",
    "paid ads": "Paid Ads",
    "paid ad": "Paid Ads",
    "paid": "Paid Ads",
    "social media": "Social Media",
    "social": "Social Media",
    "email": "Email",
    "seo": "SEO",
}


# ── DB helpers ─────────────────────────────────────────────────────────────────

def run_query(query: str) -> list:
    if not query or query.strip().upper() in ("", "NONE"):
        return []
    conn = sqlite3.connect(DB_PATH)
    try:
        df = pd.read_sql_query(query, conn)
        return df.to_dict(orient="records")
    except Exception as e:
        raise Exception(f"Database error: {e}")
    finally:
        conn.close()


def _date_format() -> str:
    try:
        conn = sqlite3.connect(DB_PATH)
        row = pd.read_sql_query("SELECT Date FROM campaigns LIMIT 1", conn)
        conn.close()
        if row.empty:
            return "iso"
        sample = str(row.iloc[0, 0])
        return "dmy" if re.match(r"^\d{2}-\d{2}-\d{4}$", sample) else "iso"
    except Exception:
        return "iso"


def _month_where(months: list) -> str:
    fmt = _date_format()
    if fmt == "dmy":
        conditions = " OR ".join(f"substr(Date, 4, 2) = '{m}'" for m in months)
    else:
        conditions = " OR ".join(f"strftime('%m', Date) = '{m}'" for m in months)
    return f"({conditions})"


def _last_n_months_where(n: int) -> str:
    fmt = _date_format()
    
    # Use a fixed reference date or the latest date in DB
    try:
        conn = sqlite3.connect(DB_PATH)
        # Just grab ONE sample or a few to avoid overhead, or use a better SQL query
        df_sample = pd.read_sql_query("SELECT Date FROM campaigns LIMIT 100", conn)
        conn.close()
        
        if not df_sample.empty:
            if fmt == "dmy":
                # Convert the strings to proper timestamps for comparison
                # We want the 'logical' max date
                sample_dates = pd.to_datetime(df_sample["Date"], format="%d-%m-%Y", errors='coerce').dropna()
                now = sample_dates.max() if not sample_dates.empty else pd.Timestamp.today()
            else:
                sample_dates = pd.to_datetime(df_sample["Date"], errors='coerce').dropna()
                now = sample_dates.max() if not sample_dates.empty else pd.Timestamp.today()
        else:
            now = pd.Timestamp.today()
    except Exception:
        now = pd.Timestamp.today()

    # Fallback to a point in 2025 if 'now' is somehow way in the future but we have 2024-2025 data
    if now.year > 2026:
         now = pd.Timestamp(year=2025, month=6, day=1)

    pairs = []
    for i in range(n):
        dt = now - pd.DateOffset(months=i)
        pairs.append((dt.year, f"{dt.month:02d}"))

    if fmt == "dmy":
        conditions = " OR ".join(
            f"(substr(Date,7,4)='{y}' AND substr(Date,4,2)='{m}')" for y, m in pairs
        )
    else:
        conditions = " OR ".join(
            f"(strftime('%Y',Date)='{y}' AND strftime('%m',Date)='{m}')" for y, m in pairs
        )
    return f"({conditions})"


def get_db_schema() -> str:
    try:
        conn = sqlite3.connect(DB_PATH)
        df = pd.read_sql_query("SELECT * FROM campaigns LIMIT 200", conn)
        conn.close()
        if df.empty:
            return "Table: campaigns  (empty)"
        lines = ["Table: campaigns", f"Row count (sample): {len(df)}", "", "Columns:"]
        for col in df.columns:
            dtype = str(df[col].dtype)
            samples = df[col].dropna().unique()[:5]
            sample_str = ", ".join(str(s) for s in samples)
            lines.append(f"  {col} ({dtype}) — sample values: {sample_str}")
        return "\n".join(lines)
    except Exception:
        return (
            "Table: campaigns\n"
            "Columns: Campaign_ID, Campaign_Type, Target_Audience, Duration, "
            "Channel_Used, Impressions, Clicks, Leads, Conversions, Revenue, "
            "Acquisition_Cost, ROI, Language, Engagement_Score, Customer_Segment, Date"
        )


def _deduplicate_columns(data: list) -> list:
    if not data:
        return data
    original_keys = list(data[0].keys())
    if not any(original_keys.count(k) > 1 for k in original_keys):
        return data
    new_data = []
    for row in data:
        new_row: dict = {}
        counter: dict = {}
        for k, v in row.items():
            count = counter.get(k, 0)
            counter[k] = count + 1
            new_key = f"{k}_{count}" if original_keys.count(k) > 1 else k
            new_row[new_key] = v
        new_data.append(new_row)
    return new_data


def _sort_chronologically(data: list) -> list:
    if not data:
        return data
    date_col = list(data[0].keys())[0]
    fmt = _date_format()

    def sort_key(row: dict):
        val = str(row.get(date_col, ""))
        try:
            if fmt == "dmy" and re.match(r"^\d{2}-\d{2}-\d{4}$", val):
                d, m, y = val.split("-")
                return f"{y}-{m}-{d}"
            return val
        except Exception:
            return val

    return sorted(data, key=sort_key)


def is_query_relevant(query: str) -> bool:
    q = query.lower()
    base_keywords = [
        "campaign", "marketing", "ad", "ads", "seo", "email", "roi", "revenue",
        "impressions", "clicks", "conversions", "audience", "channel", "cost",
        "spend", "budget", "lead", "leads", "engagement", "segment", "customer",
        "date", "performance", "trend", "monthly", "strategy", "insight",
        "best", "top", "data", "report",
    ]
    try:
        conn = sqlite3.connect(DB_PATH)
        df = pd.read_sql_query("SELECT * FROM campaigns LIMIT 1", conn)
        conn.close()
        base_keywords.extend(c.lower() for c in df.columns)
    except Exception:
        pass
    return any(kw in q for kw in base_keywords)


def _get_actual_campaign_types() -> list:
    """Fetch distinct Campaign_Type values from the live DB."""
    try:
        conn = sqlite3.connect(DB_PATH)
        df = pd.read_sql_query(
            "SELECT DISTINCT Campaign_Type FROM campaigns WHERE Campaign_Type IS NOT NULL", conn
        )
        conn.close()
        return df["Campaign_Type"].tolist()
    except Exception:
        return CAMPAIGN_TYPE_LABELS


# ── Pydantic models ────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str


class InsightRequest(BaseModel):
    query: Optional[str] = None
    data_context: Optional[str] = None


class ChatRequest(BaseModel):
    query: str
    history: Optional[List[Dict[str, str]]] = None
    dashboard_context: Optional[str] = None


# ── Shared response builder ────────────────────────────────────────────────────

def build_response(chart_type: str, data: list, title: str, sql: str = "") -> dict:
    # ── Clean data for JSON compliance (replace NaN/Inf with 0) ──
    clean_data = []
    for row in data:
        new_row = {}
        for k, v in row.items():
            # Check for NaN (v != v) or Inf
            if isinstance(v, float) and (v != v or v == float('inf') or v == float('-inf')):
                new_row[k] = 0
            else:
                new_row[k] = v
        clean_data.append(new_row)
    data = clean_data

    series, x_key = [], ""
    insight = "Data analysis complete."
    summary: Dict[str, Any] = {
        "total_records_analyzed": len(data),
        "key_metric": "",
        "top_performer": "",
    }

    if data:
        keys   = list(data[0].keys())
        x_key  = keys[0]
        y_keys = keys[1:]
        for i, yk in enumerate(y_keys):
            series.append({
                "key":   yk,
                "label": yk.replace("_", " "),
                "color": COLORS[i % len(COLORS)],
            })
        if y_keys:
            metric  = y_keys[0]
            total   = sum(
                d.get(metric, 0) for d in data
                if isinstance(d.get(metric), (int, float))
            )
            top_row = max(
                data,
                key=lambda x: x.get(metric, 0) if isinstance(x.get(metric, 0), (int, float)) else 0,
                default={},
            )
            summary["key_metric"]    = str(total)
            summary["top_performer"] = str(top_row.get(x_key, "N/A"))
            insight = f"Top '{x_key}' is {top_row.get(x_key, 'N/A')} leading the metric."

    return {
        "sql":        sql,
        "chart_type": chart_type,
        "title":      title,
        "xKey":       x_key,
        "series":     series,
        "data":       data,
        "insight":    insight,
        "summary":    summary,
    }


# ── Comparison query interceptor ───────────────────────────────────────────────

def _try_comparison_intercept(q: str, original_query: str) -> Optional[dict]:
    """
    Detects 'compare X and Y' / 'X vs Y' patterns for Campaign_Type metrics.
    Returns a build_response dict if matched, else None.
    """
    is_compare = (
        "compare" in q
        or " vs " in q
        or " versus " in q
        or re.search(r"\bvs\.?\b", q)
    )
    if not is_compare:
        return None

    # Resolve metric
    metric, agg = "ROI", "AVG"
    if "revenue" in q or "sales" in q:
        metric, agg = "Revenue", "SUM"
    elif "conversion" in q:
        metric, agg = "Conversions", "SUM"
    elif "click" in q:
        metric, agg = "Clicks", "SUM"
    elif "impression" in q:
        metric, agg = "Impressions", "SUM"
    elif "lead" in q:
        metric, agg = "Leads", "SUM"
    elif "cost" in q or "spend" in q:
        metric, agg = "Acquisition_Cost", "AVG"
    elif "engagement" in q:
        metric, agg = "Engagement_Score", "AVG"

    # Match campaign types — longest keyword first to avoid partial matches
    actual_types = _get_actual_campaign_types()
    found = []
    sorted_map = sorted(CAMPAIGN_TYPE_MAP.keys(), key=len, reverse=True)
    for kw in sorted_map:
        label = CAMPAIGN_TYPE_MAP[kw]
        if kw in q and label in actual_types and label not in found:
            found.append(label)
        if len(found) == 2:
            break

    if len(found) < 2:
        return None  # Can't resolve two distinct types → fall through

    t1, t2 = found[0], found[1]
    # Safe SQL alias: replace spaces/special chars with underscore
    alias1 = re.sub(r"[^a-zA-Z0-9]", "_", t1) + f"_{metric}"
    alias2 = re.sub(r"[^a-zA-Z0-9]", "_", t2) + f"_{metric}"

    # Determine grouping: time-series vs category
    is_time = any(w in q for w in ["over", "trend", "month", "week", "day", "time", "last"])

    date_hint   = _date_format()
    last6_where = _last_n_months_where(6)

    if is_time:
        sql = f"""
            SELECT Date,
                {agg}(CASE WHEN Campaign_Type = '{t1}' THEN {metric} END) AS {alias1},
                {agg}(CASE WHEN Campaign_Type = '{t2}' THEN {metric} END) AS {alias2}
            FROM campaigns
            WHERE ({last6_where})
            GROUP BY Date
            ORDER BY Date ASC
        """
        data = run_query(sql.strip())
        data = _sort_chronologically(data)
        return build_response("line", data, original_query, sql.strip())
    else:
        # Side-by-side bar
        sql = f"""
            SELECT Campaign_Type,
                {agg}({metric}) AS {metric}
            FROM campaigns
            WHERE Campaign_Type IN ('{t1}', '{t2}')
            GROUP BY Campaign_Type
            ORDER BY {metric} DESC
        """
        data = run_query(sql.strip())
        return build_response("bar", data, original_query, sql.strip())


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    filename = file.filename
    content  = await file.read()
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(".json"):
            df = pd.read_json(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported format. Use CSV, JSON, or Excel.")

        conn = sqlite3.connect(DB_PATH)
        df.to_sql("campaigns", conn, if_exists="replace", index=False)
        conn.close()
        return {
            "status":  "success",
            "message": f"Loaded {len(df)} rows from {filename}",
            "columns": list(df.columns),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")


@app.get("/api/kpis")
def get_kpis():
    try:
        conn = sqlite3.connect(DB_PATH)
        df = pd.read_sql_query("SELECT * FROM campaigns", conn)
        conn.close()

        if df.empty:
            return {"Total_Revenue": "₹0.0M", "Average_ROI": "0.00", "Best_Channel": "N/A", "Best_Segment": "N/A"}

        def safe_sum(col: str) -> float:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                v = df[col].sum()
                return float(v) if pd.notna(v) else 0.0
            return 0.0

        def safe_mean(col: str) -> float:
            if col in df.columns and pd.api.types.is_numeric_dtype(df[col]):
                v = df[col].mean()
                return float(v) if pd.notna(v) else 0.0
            return 0.0

        total_revenue = safe_sum("Revenue")
        avg_roi       = safe_mean("ROI")

        best_channel = "N/A"
        if "Channel_Used" in df.columns and "ROI" in df.columns:
            try:
                best_channel = str(df.groupby("Channel_Used")["ROI"].mean().idxmax())
            except Exception:
                pass

        best_segment = "N/A"
        if "Customer_Segment" in df.columns and "Conversions" in df.columns:
            try:
                best_segment = str(df.groupby("Customer_Segment")["Conversions"].sum().idxmax())
            except Exception:
                pass

        return {
            "Total_Revenue": f"₹{total_revenue / 1_000_000:.1f}M",
            "Average_ROI":   f"{avg_roi:.2f}",
            "Best_Channel":  "N/A" if str(best_channel) == "nan" else best_channel,
            "Best_Segment":  "N/A" if str(best_segment) == "nan" else best_segment,
        }
    except Exception:
        return {"Total_Revenue": "₹0.0M", "Average_ROI": "0.00", "Best_Channel": "N/A", "Best_Segment": "N/A"}


@app.get("/api/funnel")
def get_funnel():
    try:
        conn = sqlite3.connect(DB_PATH)
        df = pd.read_sql_query(
            "SELECT SUM(Impressions) as impressions, SUM(Clicks) as clicks, "
            "SUM(Leads) as leads, SUM(Conversions) as conversions FROM campaigns",
            conn,
        )
        conn.close()
        if df.empty or pd.isna(df.iloc[0]["impressions"]):
            return []
        return [
            {"name": "Impressions", "value": int(df.iloc[0]["impressions"])},
            {"name": "Clicks",      "value": int(df.iloc[0]["clicks"])},
            {"name": "Leads",       "value": int(df.iloc[0]["leads"])},
            {"name": "Conversions", "value": int(df.iloc[0]["conversions"])},
        ]
    except Exception:
        return []


@app.post("/api/insights")
def generate_insights(request: Optional[InsightRequest] = None):
    if not api_key:
        return {"insights": [
            "Paid Ads generate highest ROI",
            "YouTube campaigns have highest engagement",
            "Add GEMINI_API_KEY in backend/.env for AI insights!",
        ]}

    if request and request.data_context:
        summary_data = f"User asked: {request.query}\nData:\n{request.data_context}"
    else:
        try:
            conn = sqlite3.connect(DB_PATH)
            df = pd.read_sql_query(
                "SELECT Campaign_Type, Channel_Used, SUM(Revenue) as Total_Revenue, "
                "AVG(ROI) as Avg_ROI FROM campaigns "
                "GROUP BY Campaign_Type, Channel_Used ORDER BY Total_Revenue DESC LIMIT 5",
                conn,
            )
            conn.close()
            summary_data = df.to_string()
        except Exception:
            summary_data = "No data available."

    prompt = f"""
You are an AI Marketing Analyst. Based on this digital marketing campaign data,
provide exactly 3 short bullet point insights (max 8 words each) and 1 short
Optimization Recommendation (max 20 words).

Data:
{summary_data}

Return ONLY this JSON (no markdown):
{{
   "insights": ["insight 1", "insight 2", "insight 3"],
   "recommendation": "recommendation here"
}}
"""
    try:
        model    = genai.GenerativeModel(INSIGHT_MODEL)
        response = model.generate_content(prompt)
        text     = response.text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        parsed   = json.loads(text)
        return {
            "insights":       parsed.get("insights", []),
            "recommendation": parsed.get("recommendation", "Consider reviewing campaign targets to optimise cost."),
        }
    except Exception as e:
        err = str(e)
        if "429" in err or "quota" in err.lower():
            if request and request.data_context:
                try:
                    ctx = json.loads(request.data_context)
                    if isinstance(ctx, list) and ctx:
                        top_row = ctx[0]
                        if isinstance(top_row, dict) and top_row:
                            cols    = list(top_row.keys())
                            grp_col = cols[0]
                            met_col = cols[1] if len(cols) > 1 else "Performance"
                            top_grp = top_row.get(grp_col, "Top group")
                            return {
                                "insights": [
                                    f"{top_grp} leads overall {met_col} metrics.",
                                    f"Strong variance observed across {grp_col} categories.",
                                    f"Focus on {top_grp} for best {met_col} returns.",
                                ],
                                "recommendation": (
                                    f"Allocate 20% more budget to {top_grp} "
                                    f"to maximise {met_col} immediately."
                                ),
                            }
                except Exception:
                    pass
            return {
                "insights": [
                    "Performance scales well with high-engagement channels.",
                    "Review demographic splits for better cost-per-acquisition.",
                    "Short campaigns show lower cumulative engagement.",
                ],
                "recommendation": "Shift budget to top-tier segments to improve acquisition rates.",
            }
        return {"insights": ["Unable to fetch AI insights.", err], "recommendation": "Service unavailable."}


# ── Natural language query ─────────────────────────────────────────────────────

@app.post("/api/query")
def natural_language_query(request: QueryRequest):
    off_topic_response = {
        "sql": "", "chart_type": "error", "data": [], "title": request.query,
        "error_message": (
            f"⚠️ I can only answer questions about your business data. "
            f"'{request.query.strip().rstrip('?')}' is outside the scope of this dashboard.\n\n"
            "Try:\n• 'Show me monthly revenue by region'\n"
            "• 'Top performing campaigns by ROI'\n"
            "• 'Customer churn rate for Q3'"
        ),
    }

    if not is_query_relevant(request.query):
        return off_topic_response

    q = request.query.lower()

    # ── Comparison interceptor (runs before Gemini & local parser) ─────────────
    comparison_result = _try_comparison_intercept(q, request.query)
    if comparison_result is not None:
        return comparison_result

    # ── Gemini path ────────────────────────────────────────────────────────────
    if api_key:
        schema      = get_db_schema()
        date_hint   = _date_format()
        last6_where = _last_n_months_where(6)
        actual_types = _get_actual_campaign_types()

        prompt = f"""
You are an expert SQLite analyst. Dates are in {"DD-MM-YYYY" if date_hint=="dmy" else "ISO YYYY-MM-DD"} format.

Schema:
{schema}

ACTUAL Campaign_Type values that exist in the DB (use these EXACTLY, no variations):
{actual_types}

User question: "{request.query}"

CRITICAL RULES:
1. For COMPARISON queries ("X vs Y", "Compare X and Y"):
   - You MUST use CASE WHEN pivot logic.
   - You MUST alias each pivoted column UNIQUELY — include the category name in the alias.
   - BAD:  AVG(CASE WHEN Campaign_Type='Influencer' THEN ROI END) AS ROI
   - GOOD: AVG(CASE WHEN Campaign_Type='Influencer' THEN ROI END) AS Influencer_ROI
   - ONLY use Campaign_Type values from the list above — never invent new ones.

2. For DATE RANGE filters (e.g., "last 6 months"):
   - Apply: WHERE {last6_where}
   - NEVER skip the WHERE clause if months are mentioned.

3. For LINE charts (trends):
   - You MUST GROUP BY Date AND ORDER BY Date ASC.
   - chart_type = "line"

Return ONLY this JSON (no markdown, no explanation):
{{
    "sql": "...",
    "chart_type": "bar|line|pie|funnel|table|none|error",
    "error_message": ""
}}
"""
        try:
            model    = genai.GenerativeModel(SQL_MODEL)
            response = model.generate_content(prompt)
            text     = response.text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            parsed   = json.loads(text)
            sql           = parsed.get("sql", "")
            chart_type    = parsed.get("chart_type", "bar")
            error_message = parsed.get("error_message", "")

            if chart_type == "error":
                return {**off_topic_response, "error_message": error_message or off_topic_response["error_message"]}

            data = run_query(sql) if sql else []
            data = _deduplicate_columns(data)
            if chart_type == "line":
                data = _sort_chronologically(data)
            
            print(f"DEBUG: Query: {request.query}")
            print(f"DEBUG: SQL: {sql}")
            print(f"DEBUG: Data Rows: {len(data)}")
            
            return build_response(chart_type, data, request.query, sql)

        except Exception:
            pass  # fall through to local parser

    # ── Local NLP fallback ─────────────────────────────────────────────────────
    try:
        marketing_kws = [
            "campaign", "marketing", "ad", "seo", "email", "roi", "revenue",
            "impressions", "clicks", "conversions", "audience", "channel", "cost", "spend",
        ]
        if not any(kw in q for kw in marketing_kws):
            return off_topic_response

        group_map = {
            "channel": "Channel_Used", "platform": "Channel_Used",
            "audience": "Target_Audience", "target": "Target_Audience", "demographic": "Target_Audience",
            "segment": "Customer_Segment", "customer": "Customer_Segment", "region": "Customer_Segment",
            "language": "Language",
            "campaign type": "Campaign_Type", "type": "Campaign_Type", "campaign": "Campaign_Type",
            "month": "Date", "date": "Date", "time": "Date",
            "monthly": "Date", "quarterly": "Date", "weekly": "Date", "daily": "Date",
        }
        metric_map = {
            "roi": ("ROI", "AVG"), "return": ("ROI", "AVG"),
            "revenue": ("Revenue", "SUM"), "sales": ("Revenue", "SUM"), "income": ("Revenue", "SUM"),
            "conversion": ("Conversions", "SUM"), "conversions": ("Conversions", "SUM"),
            "click": ("Clicks", "SUM"), "clicks": ("Clicks", "SUM"),
            "impression": ("Impressions", "SUM"), "impressions": ("Impressions", "SUM"),
            "lead": ("Leads", "SUM"), "leads": ("Leads", "SUM"),
            "cost": ("Acquisition_Cost", "AVG"), "spend": ("Acquisition_Cost", "AVG"),
            "budget": ("Acquisition_Cost", "AVG"), "engagement": ("Engagement_Score", "AVG"),
        }

        group_by     = "Campaign_Type"
        metric       = "Revenue"
        agg          = "SUM"
        chart_type   = "bar"
        where_clause = ""
        sql          = ""

        if "broken" in q and "region" in q:
            group_by = "Customer_Segment"
        else:
            for kw, col in group_map.items():
                if kw in q:
                    group_by = col
                    break

        for kw, (col, agg_fn) in metric_map.items():
            if kw in q:
                metric = col
                agg    = agg_fn
                break

        if any(w in q for w in ["time", "trend", "monthly", "weekly", "daily"]) or group_by == "Date":
            group_by   = "Date"
            chart_type = "line"
        elif "pie" in q or "distribution" in q or "breakdown" in q or "split" in q:
            chart_type = "pie"
        elif "donut" in q:
            chart_type = "donut"
        elif "funnel" in q or ("impression" in q and "click" in q):
            sql = (
                "SELECT SUM(Impressions) as Impressions, SUM(Clicks) as Clicks, "
                "SUM(Leads) as Leads, SUM(Conversions) as Conversions FROM campaigns"
            )
            if "youtube" in q:
                sql += " WHERE Channel_Used = 'YouTube'"
            chart_type = "funnel"
        elif any(
            w in q.replace("?", " ").replace(".", " ").split()
            for w in ["strategy", "advice", "insight", "recommend", "how", "why"]
        ):
            chart_type = "none"

        quarter_match = re.search(r"q([1-4])", q)
        if quarter_match:
            months = QUARTER_MONTHS[int(quarter_match.group(1))]
            where_clause = f" WHERE {_month_where(months)}"
            if group_by != "Date":
                chart_type = "bar"

        for month_name, month_num in MONTH_MAP.items():
            if month_name in q:
                where_clause = f" WHERE {_month_where([month_num])}"
                break

        if chart_type not in ("funnel", "none") and not sql:
            order_dir = "ASC" if group_by == "Date" else "DESC"
            limit     = "LIMIT 30" if group_by == "Date" else "LIMIT 10"
            sql = (
                f"SELECT {group_by}, {agg}({metric}) as {metric} "
                f"FROM campaigns{where_clause} "
                f"GROUP BY {group_by} ORDER BY {metric} {order_dir} {limit}"
            )

        data = run_query(sql)
        return build_response(chart_type, data, request.query, sql)

    except Exception as local_err:
        raise HTTPException(status_code=500, detail=f"Both Gemini and local parser failed: {local_err}")


# ── Conversational chat ────────────────────────────────────────────────────────

@app.post("/api/chat")
def chat_with_data(request: ChatRequest):
    if not is_query_relevant(request.query):
        return {
            "reply": (
                f"⚠️ I can only answer questions about your business data. "
                f"'{request.query.strip().rstrip('?')}' is outside scope.\n\n"
                "Try:\n• 'Show me monthly revenue by region'\n"
                "• 'Top performing campaigns by ROI'\n• 'Customer churn rate for Q3'"
            ),
            "has_data": False,
            "off_topic": True,
        }

    dataset_context = ""
    try:
        conn       = sqlite3.connect(DB_PATH)
        schema_info = get_db_schema()

        stats_df = pd.read_sql_query("""
            SELECT COUNT(*) as total_campaigns,
                   SUM(Revenue) as total_revenue,   AVG(ROI) as avg_roi,
                   SUM(Conversions) as total_conversions,
                   SUM(Impressions) as total_impressions,
                   SUM(Clicks) as total_clicks,      SUM(Leads) as total_leads,
                   AVG(Acquisition_Cost) as avg_cac, AVG(Engagement_Score) as avg_engagement
            FROM campaigns
        """, conn)

        top_types = pd.read_sql_query("""
            SELECT Campaign_Type, SUM(Revenue) as revenue,
                   AVG(ROI) as avg_roi, SUM(Conversions) as conversions
            FROM campaigns GROUP BY Campaign_Type ORDER BY revenue DESC
        """, conn)

        top_segments = pd.read_sql_query("""
            SELECT Customer_Segment, SUM(Revenue) as revenue,
                   AVG(ROI) as avg_roi, SUM(Conversions) as conversions
            FROM campaigns GROUP BY Customer_Segment ORDER BY revenue DESC
        """, conn)

        top_channels = pd.read_sql_query("""
            SELECT Channel_Used, AVG(ROI) as avg_roi,
                   SUM(Revenue) as revenue, SUM(Conversions) as conversions
            FROM campaigns GROUP BY Channel_Used ORDER BY avg_roi DESC
        """, conn)
        conn.close()

        for frame in [stats_df, top_types, top_segments, top_channels]:
            frame.fillna(0, inplace=True)

        s = stats_df.iloc[0] if not stats_df.empty else pd.Series(
            0,
            index=["total_campaigns","total_revenue","avg_roi","total_conversions",
                   "total_impressions","total_clicks","total_leads","avg_cac","avg_engagement"],
        )

        dataset_context = f"""
{schema_info}

LIVE STATS:
- Campaigns           : {int(s['total_campaigns']):,}
- Total revenue       : ₹{s['total_revenue']:,.0f}  (₹{s['total_revenue']/1e6:.2f}M)
- Average ROI         : {s['avg_roi']:.2f}
- Total conversions   : {int(s['total_conversions']):,}
- Total impressions   : {int(s['total_impressions']):,}
- Total clicks        : {int(s['total_clicks']):,}
- Total leads         : {int(s['total_leads']):,}
- Avg acquisition cost: ₹{s['avg_cac']:.2f}
- Avg engagement      : {s['avg_engagement']:.2f}

REVENUE BY CAMPAIGN TYPE:
{top_types.to_string(index=False)}

REVENUE BY CUSTOMER SEGMENT:
{top_segments.to_string(index=False)}

ROI BY CHANNEL:
{top_channels.to_string(index=False)}
"""
    except Exception as e:
        dataset_context = f"[Could not load dataset stats: {e}]"

    query_result_context = ""
    q_lower = request.query.lower()
    data_kws = [
        "how many", "total", "average", "which", "top", "best", "worst",
        "revenue", "roi", "conversion", "campaign", "channel", "compare",
        "show me", "what is", "count", "sum", "highest", "lowest",
    ]
    if any(kw in q_lower for kw in data_kws):
        try:
            qr = natural_language_query(QueryRequest(query=request.query))
            if qr.get("data"):
                preview = json.dumps(qr["data"][:10], indent=2)
                query_result_context = (
                    f"\nLive query result for this question:\n"
                    f"SQL: {qr.get('sql', 'N/A')}\n"
                    f"Data (first 10 rows):\n{preview}\n"
                )
        except Exception:
            pass

    history_text = ""
    for msg in (request.history or [])[-6:]:
        role = msg.get("type") or msg.get("role") or "user"
        text = msg.get("text") or msg.get("content") or ""
        history_text += f"\n{'User' if role == 'user' else 'AI'}: {text}"

    dash_ctx = (
        f"\nDashboard currently showing: {request.dashboard_context}\n"
        if request.dashboard_context else ""
    )

    actual_types = _get_actual_campaign_types()
    system_prompt = f"""You are QueryIQ AI — a smart, friendly data analyst for the Nykaa Digital Marketing Dashboard.
You have access to the real campaign data below. Always cite specific numbers.
Be concise, use bullet points, and keep responses under 200 words unless more detail is requested.

ACTUAL Campaign_Type values in DB: {actual_types}
(Never reference campaign types that are not in this list.)

STRICT RULE: If the user asks anything outside business data analysis (news, sports, coding, weather, etc.),
respond EXACTLY:
"⚠️ I can only answer questions related to your business data. [TOPIC] is outside scope of this dashboard.
Try: 'Show me monthly revenue by region' | 'Top campaigns by ROI' | 'Q3 conversion rate'"

Never fabricate data. Never answer off-topic questions.

{dataset_context}
{query_result_context}
{dash_ctx}

Conversation:{history_text}

User: {request.query}"""

    if not api_key:
        try:
            conn  = sqlite3.connect(DB_PATH)
            stats = pd.read_sql_query(
                "SELECT Campaign_Type, SUM(Revenue) as rev, AVG(ROI) as roi "
                "FROM campaigns GROUP BY Campaign_Type ORDER BY rev DESC LIMIT 3",
                conn,
            )
            conn.close()
            top = stats.iloc[0]
            return {
                "reply": (
                    f"Based on the Nykaa campaign data:\n\n"
                    f"• **Top campaign**: {top['Campaign_Type']} — ₹{top['rev']:,.0f} revenue\n"
                    f"• **Average ROI**: {top['roi']:.2f}\n\n"
                    f"Add GEMINI_API_KEY to backend/.env for full AI chat."
                ),
                "has_data": True,
            }
        except Exception:
            return {"reply": "Please configure GEMINI_API_KEY in backend/.env.", "has_data": False}

    try:
        model    = genai.GenerativeModel(CHAT_MODEL)
        response = model.generate_content(system_prompt)
        return {"reply": response.text, "has_data": True}

    except Exception as e:
        err = str(e)
        if "429" in err or "quota" in err.lower():
            try:
                conn = sqlite3.connect(DB_PATH)
                if any(kw in q_lower for kw in ["revenue", "money", "earn"]):
                    df = pd.read_sql_query(
                        "SELECT Campaign_Type, SUM(Revenue) as Revenue FROM campaigns "
                        "GROUP BY Campaign_Type ORDER BY Revenue DESC",
                        conn,
                    )
                    conn.close()
                    lines = [f"• {r['Campaign_Type']}: ₹{r['Revenue']:,.0f}" for _, r in df.iterrows()]
                    return {
                        "reply": "Revenue by campaign type:\n\n" + "\n".join(lines) + "\n\n(Local fallback — quota exceeded)",
                        "has_data": True,
                    }
                if "roi" in q_lower:
                    df = pd.read_sql_query(
                        "SELECT Campaign_Type, AVG(ROI) as Avg_ROI FROM campaigns "
                        "GROUP BY Campaign_Type ORDER BY Avg_ROI DESC",
                        conn,
                    )
                    conn.close()
                    lines = [f"• {r['Campaign_Type']}: {r['Avg_ROI']:.2f}" for _, r in df.iterrows()]
                    return {
                        "reply": "Avg ROI by campaign type:\n\n" + "\n".join(lines) + "\n\n(Local fallback — quota exceeded)",
                        "has_data": True,
                    }
                conn.close()
                return {
                    "reply": "AI service busy. Ask something specific like 'total revenue by campaign type'.",
                    "has_data": False,
                }
            except Exception:
                return {"reply": "AI temporarily unavailable. Please retry.", "has_data": False}

        raise HTTPException(status_code=500, detail=err)
