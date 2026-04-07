import io
import os
import re
import sqlite3

import numpy as np
import pandas as pd

# ── Config --------------------------------------------------------------------
CSV_FILENAME = "../Nykaa_Digital_Marketing_Clean.csv.csv"
DB_PATH      = "marketing_campaigns.db"
TABLE_NAME   = "campaigns"

# Realistic click-through rates per channel (Clicks / Impressions)
CHANNEL_CTR: dict[str, float] = {
    "YouTube":   0.040,
    "Instagram": 0.035,
    "Facebook":  0.028,
    "Google":    0.055,
    "Email":     0.025,
    "Twitter":   0.020,
    "LinkedIn":  0.018,
    "SEO":       0.060,
}
DEFAULT_CTR = 0.030

# Realistic lead-to-conversion multipliers per channel
CHANNEL_L2C: dict[str, float] = {
    "YouTube":   3.5,
    "Instagram": 3.0,
    "Facebook":  3.2,
    "Google":    2.8,
    "Email":     2.5,
    "Twitter":   4.0,
    "LinkedIn":  2.6,
    "SEO":       3.0,
}
DEFAULT_L2C = 3.0

# Deterministic fallback when no Cost/ROI columns exist
FIXED_AVG_ORDER_VALUE = 1_200.0


# ── Helpers --------------------------------------------------------------------

def _detect_roi_scale(series: pd.Series) -> str:
    """
    Return 'percent' if ROI values look like percentage points (median > 10)
    or 'decimal' if already expressed as a multiplier.
    E.g. median=150 -> percent  (Revenue = Cost x (1 + ROI/100))
         median=1.5 -> decimal  (Revenue = Cost x (1 + ROI))
    """
    return "percent" if series.median() > 10 else "decimal"


def _derive_revenue(df: pd.DataFrame) -> pd.Series:
    """
    Correct formula: ROI (%) = (Revenue − Cost) / Cost x 100
      ⟹  Revenue = Cost x (1 + ROI / 100)   when ROI is in percent
      ⟹  Revenue = Cost x (1 + ROI)          when ROI is already a decimal
    """
    cost  = df["Acquisition_Cost"].fillna(0)
    roi   = df["ROI"].fillna(0)
    scale = _detect_roi_scale(roi)
    revenue = cost * (1 + roi / 100) if scale == "percent" else cost * (1 + roi)
    return revenue.clip(lower=0).round(2)


def _derive_impressions(df: pd.DataFrame) -> pd.Series:
    """Impressions = Clicks / CTR  using per-channel CTR so funnel ratios are realistic."""
    clicks  = df["Clicks"].fillna(0)
    channel = df.get("Channel_Used", pd.Series([""] * len(df), index=df.index))
    ctr     = channel.map(CHANNEL_CTR).fillna(DEFAULT_CTR).replace(0, DEFAULT_CTR)
    return (clicks / ctr).round(0).astype(int)


def _derive_leads(df: pd.DataFrame) -> pd.Series:
    """Leads = Conversions x per-channel lead-to-conversion ratio."""
    conversions = df["Conversions"].fillna(0)
    channel     = df.get("Channel_Used", pd.Series([""] * len(df), index=df.index))
    ratio       = channel.map(CHANNEL_L2C).fillna(DEFAULT_L2C)
    return (conversions * ratio).round(0).astype(int)


def _derive_conversions(df: pd.DataFrame) -> pd.Series:
    """Conversions = Clicks x (Conversion_Rate / 100) if available, else 50."""
    if "Conversion_Rate" in df.columns and "Clicks" in df.columns:
        return (df["Clicks"].fillna(0) * df["Conversion_Rate"].fillna(0) / 100).round(0).astype(int)
    return pd.Series([50] * len(df), index=df.index, dtype=int)


def _derive_dates(n: int) -> pd.Series:
    """Spread n records evenly over the last 12 months in DD-MM-YYYY format."""
    end   = pd.Timestamp.today().normalize()
    start = end - pd.DateOffset(months=12)
    dates = pd.date_range(start=start, end=end, periods=n)
    return pd.Series(dates.strftime("%d-%m-%Y"), name="Date")


def _normalise_date_column(series: pd.Series) -> pd.Series:
    """Parse any date format and return DD-MM-YYYY strings."""
    parsed = pd.to_datetime(series, errors="coerce")
    return parsed.dt.strftime("%d-%m-%Y").fillna("01-01-2025")


# ── Main ingestion ─────────────────────────────────────────────────────────────

def ingest_real_data(csv_filename: str = CSV_FILENAME) -> None:
    if not os.path.exists(csv_filename):
        print(f"[ERROR] '{csv_filename}' not found.")
        return

    print(f"[INFO] Loading '{csv_filename}' ...")
    
    # Extract CSV data if it's wrapped in a webarchive plist (which we saw starts with 'bplist00')
    try:
        with open(csv_filename, 'rb') as f:
            raw_bytes = f.read()
        
        # Try to find the CSV in the HTML <pre> tags
        match = re.search(rb'<pre[^>]*>(.*?)</pre>', raw_bytes, re.DOTALL)
        if match:
            print("[INFO] Extracted CSV from web-archive wrapping.")
            csv_data = match.group(1).decode('utf-8')
            df = pd.read_csv(io.StringIO(csv_data))
        else:
            # Fallback to normal read
            try:
                df = pd.read_csv(csv_filename, encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(csv_filename, encoding='cp1252')
    except Exception as e:
        print(f"[ERROR] Loading failed: {e}")
        return
    print(f"[INFO] Raw shape  : {df.shape[0]} rows x {df.shape[1]} columns")
    print(f"[INFO] Columns    : {list(df.columns)}")

    # ── 1. Conversions ────────────────────────────────────────────────────────
    if "Conversions" not in df.columns:
        print("[DERIVE] Conversions <- Clicks x Conversion_Rate / 100")
        df["Conversions"] = _derive_conversions(df)
    df["Conversions"] = pd.to_numeric(df["Conversions"], errors="coerce").fillna(0).astype(int)

    # ── 2. Revenue ────────────────────────────────────────────────────────────
    if "Revenue" not in df.columns:
        if "Acquisition_Cost" in df.columns and "ROI" in df.columns:
            scale = _detect_roi_scale(pd.to_numeric(df["ROI"], errors="coerce").fillna(0))
            print(f"[DERIVE] Revenue <- Cost x (1 + ROI{'/ 100' if scale=='percent' else ''})  [ROI scale: {scale}]")
            df["Revenue"] = _derive_revenue(df)
        else:
            print(f"[DERIVE] Revenue <- Conversions x {FIXED_AVG_ORDER_VALUE} (no Cost/ROI columns)")
            df["Revenue"] = (df["Conversions"] * FIXED_AVG_ORDER_VALUE).round(2)
    else:
        df["Revenue"] = pd.to_numeric(df["Revenue"], errors="coerce").fillna(0).round(2)

    # ── 3. Impressions ────────────────────────────────────────────────────────
    if "Impressions" not in df.columns:
        if "Clicks" in df.columns:
            print("[DERIVE] Impressions <- Clicks / channel CTR")
            df["Impressions"] = _derive_impressions(df)
        else:
            print("[DERIVE] Impressions <- 10 000 (no Clicks column)")
            df["Impressions"] = 10_000
    else:
        df["Impressions"] = pd.to_numeric(df["Impressions"], errors="coerce").fillna(0).astype(int)

    # ── 4. Leads ──────────────────────────────────────────────────────────────
    if "Leads" not in df.columns:
        print("[DERIVE] Leads <- Conversions x channel lead-to-conversion ratio")
        df["Leads"] = _derive_leads(df)
    else:
        df["Leads"] = pd.to_numeric(df["Leads"], errors="coerce").fillna(0).astype(int)

    # ── 5. Date ───────────────────────────────────────────────────────────────
    if "Date" not in df.columns:
        print("[DERIVE] Date <- evenly spread over last 12 months")
        df["Date"] = _derive_dates(len(df))
    else:
        df["Date"] = _normalise_date_column(df["Date"])

    # ── 6. Clicks (guard) ─────────────────────────────────────────────────────
    if "Clicks" not in df.columns:
        print("[DERIVE] Clicks <- 1 000 (fallback)")
        df["Clicks"] = 1_000

    # ── 7. Sanity checks ──────────────────────────────────────────────────────
    # Funnel must be monotonically decreasing: Impressions >= Clicks >= Leads >= Conversions
    df["Impressions"]  = df[["Impressions",  "Clicks"]].max(axis=1)
    df["Clicks"]       = df[["Clicks",       "Leads"]].max(axis=1)
    df["Leads"]        = df[["Leads",        "Conversions"]].max(axis=1)
    df["Revenue"]      = df["Revenue"].clip(lower=0)

    # ── 8. Write to SQLite ────────────────────────────────────────────────────
    conn   = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(f"DROP TABLE IF EXISTS {TABLE_NAME}")
    conn.commit()
    df.to_sql(TABLE_NAME, conn, if_exists="replace", index=False)
    conn.close()

    # ── 9. Verification report ────────────────────────────────────────────────
    print(f"\n[SUCCESS] {len(df)} records -> '{DB_PATH}' (table: {TABLE_NAME})")
    print("\n-- Numeric Column Summary ------------------------------------------")
    for col in ["Revenue", "ROI", "Impressions", "Clicks", "Leads", "Conversions", "Acquisition_Cost"]:
        if col in df.columns:
            s = pd.to_numeric(df[col], errors="coerce")
            print(f"  {col:<22} min={s.min():>10.2f}  max={s.max():>12.2f}  mean={s.mean():>10.2f}")
    print("--------------------------------------------------------------------")

    # ROI <-> Revenue consistency check
    if "Acquisition_Cost" in df.columns and "ROI" in df.columns:
        cost  = pd.to_numeric(df["Acquisition_Cost"], errors="coerce")
        roi   = pd.to_numeric(df["ROI"], errors="coerce")
        rev   = pd.to_numeric(df["Revenue"], errors="coerce")
        scale = _detect_roi_scale(roi.fillna(0))
        denom = cost.replace(0, np.nan)
        if scale == "percent":
            implied_roi = ((rev - cost) / denom * 100)
        else:
            implied_roi = ((rev - cost) / denom)
        delta = (implied_roi - roi).abs().mean()
        status = "[OK]" if delta < 1.0 else "[WARN]"
        print(f"\n[CHECK] {status} ROI <-> Revenue mean delta = {delta:.4f} ({'OK' if delta < 1.0 else 'review source data or ROI scale'})")

    print()


if __name__ == "__main__":
    ingest_real_data()
