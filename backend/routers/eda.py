"""EDA router — dataset statistics, variable analysis, AI summaries."""

import os

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from scipy import stats as sp_stats

router = APIRouter()


def _get_state():
    from main import get_state
    return get_state()


def _get_openai():
    from openai import OpenAI
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))


@router.get("/eda/stats")
async def eda_stats():
    state = _get_state()
    df = state.df
    if df is None:
        raise HTTPException(400, "No dataset loaded")

    numeric = df.select_dtypes(include="number")
    total_cells = df.shape[0] * df.shape[1]
    missing_cells = int(df.isnull().sum().sum())
    completeness = round((1 - missing_cells / total_cells) * 100, 1) if total_cells else 100.0

    # Descriptive stats
    desc = numeric.describe().to_dict()

    # Correlations
    corr = numeric.corr().round(3).to_dict() if len(numeric.columns) > 1 else {}

    # Missing values by column (as percentages)
    missing = {}
    for col in df.columns:
        pct = round(df[col].isnull().sum() / len(df) * 100, 2)
        missing[col] = pct

    # AI Summary via OpenAI
    ai_summary = ""
    key_insight = ""
    try:
        client = _get_openai()
        summary_prompt = (
            f"You are a data analyst. Summarize this dataset in 2 sentences:\n"
            f"- {len(df)} rows, {len(df.columns)} columns\n"
            f"- Numeric columns: {list(numeric.columns)}\n"
            f"- Missing values: {missing_cells} cells ({round(missing_cells/total_cells*100,1)}%)\n"
            f"- Top correlations: {_top_correlations(numeric)}\n"
        )
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": summary_prompt}],
            temperature=0,
            max_tokens=200,
        )
        ai_summary = resp.choices[0].message.content or ""

        insight_prompt = (
            f"Given this dataset with columns {list(df.columns)} and "
            f"{len(df)} rows, what is the single most important insight? "
            f"One sentence only."
        )
        resp2 = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": insight_prompt}],
            temperature=0,
            max_tokens=100,
        )
        key_insight = resp2.choices[0].message.content or ""
    except Exception:
        ai_summary = f"Dataset contains {len(df)} records with {len(numeric.columns)} numeric variables and {completeness}% completeness."
        key_insight = ""

    return {
        "total_records": len(df),
        "variables": len(df.columns),
        "numeric_variables": len(numeric.columns),
        "completeness": completeness,
        "descriptive": desc,
        "correlations": corr,
        "missing_values": missing,
        "ai_summary": ai_summary,
        "key_insight": key_insight,
    }


def _top_correlations(numeric_df: pd.DataFrame) -> str:
    if len(numeric_df.columns) < 2:
        return "N/A"
    corr = numeric_df.corr().abs()
    pairs = []
    for i in range(len(corr.columns)):
        for j in range(i + 1, len(corr.columns)):
            pairs.append(
                (corr.columns[i], corr.columns[j], corr.iloc[i, j])
            )
    pairs.sort(key=lambda x: x[2], reverse=True)
    top = pairs[:3]
    return ", ".join(f"{a}-{b}: {v:.2f}" for a, b, v in top)


@router.get("/eda/variable/{variable}")
async def variable_analysis(variable: str):
    state = _get_state()
    df = state.df
    if df is None:
        raise HTTPException(400, "No dataset loaded")
    if variable not in df.columns:
        raise HTTPException(404, f"Variable '{variable}' not found")

    col = df[variable].dropna()

    # Histogram data
    counts, bin_edges = np.histogram(col, bins=15)
    histogram = [
        {"bin": f"{bin_edges[i]:.1f}", "count": int(counts[i])}
        for i in range(len(counts))
    ]

    # Trend data (sequential index)
    trend = [
        {"index": i, "value": float(v)}
        for i, v in enumerate(col.values[:200])  # limit to 200 points
    ]

    return {
        "name": variable,
        "mean": float(col.mean()),
        "std": float(col.std()),
        "min": float(col.min()),
        "max": float(col.max()),
        "skewness": float(sp_stats.skew(col)),
        "histogram_data": histogram,
        "trend_data": trend,
    }


class QuestionRequest(BaseModel):
    question: str


@router.post("/eda/ask")
async def ask_eda_question(req: QuestionRequest):
    state = _get_state()
    df = state.df
    if df is None:
        raise HTTPException(400, "No dataset loaded")

    try:
        client = _get_openai()
        prompt = (
            f"You are a data analyst. The user has a pandas DataFrame with columns: "
            f"{list(df.columns)} and {len(df)} rows.\n"
            f"Descriptive statistics:\n{df.describe().to_string()}\n\n"
            f"Answer the following question concisely:\n{req.question}"
        )
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=500,
        )
        return {"answer": resp.choices[0].message.content or ""}
    except Exception as e:
        return {"answer": f"Error generating answer: {e}"}
