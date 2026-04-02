"""Chat router — NL-to-SQL with 4 model backends + context tracking."""

import base64
import io
import os
import re
import sqlite3

import httpx
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import tiktoken
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

MODEL_CONTEXT_LIMITS = {
    "gpt-3.5": 16385,
    "llama-3.1": 131072,
    "mistral": 32768,
    "qwen-2.5": 32768,
}

MODEL_TO_OLLAMA = {
    "llama-3.1": "llama3.1:latest",
    "mistral": "mistral:latest",
    "qwen-2.5": "qwen2.5-coder:latest",
}


def _get_state():
    from main import get_state
    return get_state()


def _get_openai():
    from openai import OpenAI
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))


def _count_tokens(text: str) -> int:
    try:
        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except Exception:
        return len(text) // 4


def _get_schema_info(db_path: str) -> str:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]

    info_parts = []
    for table in tables:
        cursor.execute(f"PRAGMA table_info({table});")
        cols = cursor.fetchall()
        col_info = ", ".join(f"{c[1]} ({c[2]})" for c in cols)

        cursor.execute(f"SELECT * FROM {table} LIMIT 3;")
        samples = cursor.fetchall()

        cursor.execute(f"SELECT COUNT(*) FROM {table};")
        count = cursor.fetchone()[0]

        info_parts.append(
            f"Table: {table}\n"
            f"  Columns: {col_info}\n"
            f"  Rows: {count}\n"
            f"  Sample: {samples[:2]}"
        )

    conn.close()
    return "\n".join(info_parts)


def _build_sql_prompt(schema: str, question: str) -> str:
    return (
        f"You are an expert SQL analyst. Given this SQLite database schema:\n\n"
        f"{schema}\n\n"
        f"Write a SQLite query to answer: {question}\n\n"
        f"Rules:\n"
        f"- Return ONLY the SQL query, nothing else\n"
        f"- Use SQLite syntax\n"
        f"- IMPORTANT: Column names that contain spaces MUST be quoted with double quotes, e.g. \"Adj Close\"\n"
        f"- Use the EXACT column names shown in the schema above — do NOT rename them (e.g. do NOT change spaces to underscores)\n"
        f"- Limit results to 50 rows maximum\n"
        f"- Handle potential NULL values\n"
        f"- This is SQLite — use strftime() for dates, NOT DATE_FORMAT, MONTH(), YEAR() or other MySQL/PostgreSQL functions\n"
        f"- Example date grouping: strftime('%Y-%m', Date) for monthly, strftime('%Y', Date) for yearly\n"
        f"- Write the complete query in a single statement — do NOT split it across multiple lines with comments\n"
    )


def _clean_sql(raw: str) -> str:
    """Extract SQL from LLM response."""
    # Remove markdown code blocks
    raw = re.sub(r"```sql\s*", "", raw)
    raw = re.sub(r"```\s*", "", raw)
    # Collect lines that look like SQL
    lines = [l.strip() for l in raw.strip().split("\n") if l.strip()]
    sql_lines = []
    for line in lines:
        upper = line.upper()
        if upper.startswith(("SELECT", "WITH", "INSERT", "UPDATE", "DELETE", "CREATE")):
            sql_lines.append(line)
        elif sql_lines:
            # Stop if line looks like natural language (no SQL keywords)
            if not any(
                kw in upper
                for kw in (
                    "FROM", "WHERE", "JOIN", "ON", "GROUP", "ORDER", "LIMIT",
                    "HAVING", "UNION", "AS", "AND", "OR", "NOT", "IN", "IS",
                    "BETWEEN", "LIKE", "CASE", "WHEN", "THEN", "ELSE", "END",
                    "COUNT", "SUM", "AVG", "MIN", "MAX", "DISTINCT", "COALESCE",
                    "NULLIF", "CAST", "LEFT", "RIGHT", "INNER", "OUTER", "CROSS",
                    "VALUES", "SET", "INTO", "NULL", "(", ")", ",",
                )
            ):
                break
            sql_lines.append(line)
    sql = " ".join(sql_lines) if sql_lines else raw.strip()
    # Take only the first statement (cut at first semicolon)
    if ";" in sql:
        sql = sql[: sql.index(";")]
    return sql.strip()


def _fix_column_names(sql: str, db_path: str) -> str:
    """Fix column names in SQL that don't match actual DB columns."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(data);")
    real_cols = [row[1] for row in cursor.fetchall()]
    conn.close()

    # Build a mapping: underscored/wrong versions -> real column name
    fix_map = {}
    for col in real_cols:
        # Map underscore version to real name
        underscored = col.replace(" ", "_")
        if underscored != col:
            fix_map[underscored] = f'"{col}"'
        # Map unquoted version with spaces (rare but possible)
        if " " in col and f'"{col}"' not in sql:
            fix_map[col] = f'"{col}"'

    for wrong, right in fix_map.items():
        # Replace whole-word occurrences only
        sql = re.sub(r'\b' + re.escape(wrong) + r'\b', right, sql)

    return sql


def _query_openai(prompt: str) -> str:
    client = _get_openai()
    resp = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=500,
    )
    return resp.choices[0].message.content or ""


async def _query_ollama(prompt: str, model_id: str) -> str:
    """Query local Ollama model asynchronously with generous timeout."""
    import json

    ollama_model = MODEL_TO_OLLAMA.get(model_id, "mistral:latest")
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    payload = {
        "model": ollama_model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0, "num_predict": 512},
    }

    try:
        async with httpx.AsyncClient(timeout=300) as client:
            resp = await client.post(f"{base_url}/api/generate", json=payload)
            if resp.status_code != 200:
                body = resp.text[:500]
                raise HTTPException(503, f"Ollama error {resp.status_code}: {body}")
            data = resp.json()
            return data.get("response", "")
    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(503, f"Ollama ({ollama_model}) timed out — model may be loading, try again")
    except Exception as e:
        raise HTTPException(503, f"Ollama ({ollama_model}) unavailable: {e}")


def _detect_chart_type(question: str, columns: list[str], data: list[dict]) -> str | None:
    """Auto-detect best chart type."""
    q_lower = question.lower()
    if any(w in q_lower for w in ["trend", "over time", "timeline", "monthly", "daily"]):
        return "line"
    if any(w in q_lower for w in ["compare", "group by", "per", "by region", "by category"]):
        return "bar"
    if any(w in q_lower for w in ["distribution", "histogram"]):
        return "histogram"
    if any(w in q_lower for w in ["proportion", "percentage", "share"]):
        return "pie"
    if any(w in q_lower for w in ["relationship", "correlation", "scatter", "vs"]):
        return "scatter"
    if len(data) == 1 and len(columns) <= 3:
        return "metric"
    if len(columns) == 2 and len(data) <= 20:
        return "bar"
    return None


def _create_visualization(data: list[dict], chart_type: str) -> str | None:
    """Create chart and return as base64 PNG."""
    if not data:
        return None

    df = pd.DataFrame(data)
    if df.empty:
        return None

    fig, ax = plt.subplots(figsize=(8, 4))
    fig.patch.set_facecolor("#0b1326")
    ax.set_facecolor("#171f33")
    ax.tick_params(colors="#c2c6d6", labelsize=9)
    ax.spines["bottom"].set_color("#424754")
    ax.spines["left"].set_color("#424754")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    cols = df.columns.tolist()

    try:
        if chart_type == "bar" and len(cols) >= 2:
            x_col, y_col = cols[0], cols[1]
            df_plot = df.head(15)
            ax.bar(
                range(len(df_plot)),
                pd.to_numeric(df_plot[y_col], errors="coerce"),
                color="#4d8eff",
                alpha=0.8,
            )
            ax.set_xticks(range(len(df_plot)))
            ax.set_xticklabels(df_plot[x_col].astype(str), rotation=45, ha="right", fontsize=8)
            ax.set_ylabel(y_col, color="#c2c6d6")

        elif chart_type == "line" and len(cols) >= 2:
            x_col, y_col = cols[0], cols[1]
            ax.plot(
                pd.to_numeric(df[y_col], errors="coerce"),
                color="#adc6ff",
                linewidth=2,
            )
            ax.set_xlabel(x_col, color="#c2c6d6")
            ax.set_ylabel(y_col, color="#c2c6d6")

        elif chart_type == "pie" and len(cols) >= 2:
            x_col, y_col = cols[0], cols[1]
            values = pd.to_numeric(df[y_col], errors="coerce").dropna()
            labels = df[x_col].head(len(values))
            colors_palette = ["#4d8eff", "#adc6ff", "#ffb786", "#b1c6f9", "#ffb4ab"]
            ax.pie(
                values.head(8),
                labels=labels.head(8),
                colors=colors_palette[:len(values.head(8))],
                textprops={"color": "#dae2fd", "fontsize": 9},
            )

        elif chart_type == "scatter" and len(cols) >= 2:
            x_col, y_col = cols[0], cols[1]
            ax.scatter(
                pd.to_numeric(df[x_col], errors="coerce"),
                pd.to_numeric(df[y_col], errors="coerce"),
                color="#4d8eff",
                alpha=0.6,
                s=30,
            )
            ax.set_xlabel(x_col, color="#c2c6d6")
            ax.set_ylabel(y_col, color="#c2c6d6")

        else:
            # Default: bar for single numeric column
            numeric_cols = df.select_dtypes(include="number").columns
            if len(numeric_cols) > 0:
                ax.bar(range(len(df.head(15))), df[numeric_cols[0]].head(15), color="#4d8eff", alpha=0.8)
            else:
                plt.close(fig)
                return None

    except Exception:
        plt.close(fig)
        return None

    plt.tight_layout()
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=100, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode()


def _generate_suggestions(schema: str) -> list[str]:
    """Generate specific, insightful suggestions based on actual schema columns."""
    try:
        client = _get_openai()
        prompt = (
            f"You are a senior data analyst. Given this database schema:\n{schema}\n\n"
            f"Generate exactly 6 highly specific and insightful questions that would reveal "
            f"meaningful patterns, trends, or anomalies in this data.\n\n"
            f"Rules:\n"
            f"- Each question MUST reference actual column names from the schema above\n"
            f"- Questions should uncover distributions, group comparisons, correlations, or outliers\n"
            f"- Avoid generic questions like 'show first 10 rows' or 'count all rows'\n"
            f"- Good example: 'What is the average Fare grouped by Pclass and Survived?'\n"
            f"- Questions should be concise (max 12 words)\n"
            f"- Return ONLY 6 questions, one per line, no numbering, no extra text\n"
        )
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=350,
        )
        text = resp.choices[0].message.content or ""
        lines = [
            re.sub(r"^\d+[\.\)]\s*", "", l.strip())
            for l in text.strip().split("\n")
            if l.strip() and len(l.strip()) > 10
        ]
        return lines[:6]
    except Exception:
        return [
            "What is the average of each numeric column?",
            "Show the distribution of all categorical columns",
            "Which rows have the most missing values?",
        ]


def _generate_followups(question: str, answer: str, schema: str) -> list[str]:
    """Generate follow-up questions based on the current conversation turn."""
    try:
        client = _get_openai()
        prompt = (
            f"Database schema: {schema}\n\n"
            f"User asked: {question}\n"
            f"AI answered: {answer[:300]}\n\n"
            f"Generate 3 natural follow-up questions the user might want to ask next. "
            f"They must reference actual column names from the schema. "
            f"Return ONLY 3 questions, one per line, no numbering, concise (max 10 words each)."
        )
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=150,
        )
        text = resp.choices[0].message.content or ""
        lines = [
            re.sub(r"^\d+[\.\)]\s*", "", l.strip())
            for l in text.strip().split("\n")
            if l.strip() and len(l.strip()) > 8
        ]
        return lines[:3]
    except Exception:
        return []


# ─── Request / Response ───

class ChatRequest(BaseModel):
    message: str
    model: str  # gpt-3.5, llama-3.1, mistral, qwen-2.5
    history: list[dict]


@router.post("/chat")
async def chat(req: ChatRequest):
    state = _get_state()
    if not state.db_path:
        raise HTTPException(400, "No dataset loaded — upload first")

    schema = _get_schema_info(state.db_path)
    sql_prompt = _build_sql_prompt(schema, req.message)

    # Count tokens
    total_prompt = sql_prompt + "\n".join(m.get("content", "") for m in req.history)
    tokens_used = _count_tokens(total_prompt)

    # Generate SQL
    if req.model == "gpt-3.5":
        raw_sql = _query_openai(sql_prompt)
    else:
        raw_sql = await _query_ollama(sql_prompt, req.model)

    sql = _clean_sql(raw_sql)
    sql = _fix_column_names(sql, state.db_path)
    tokens_used += _count_tokens(raw_sql)

    # Execute SQL
    data = []
    answer = ""
    try:
        conn = sqlite3.connect(state.db_path)
        cursor = conn.cursor()
        cursor.execute(sql)
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        rows = cursor.fetchall()
        conn.close()
        data = [dict(zip(columns, row)) for row in rows]

        if len(data) == 0:
            answer = "The query returned no results."
        elif len(data) == 1 and len(columns) <= 2:
            vals = ", ".join(f"{k}: {v}" for k, v in data[0].items())
            answer = f"Result: {vals}"
        else:
            answer = f"Found {len(data)} results."
    except Exception as e:
        answer = f"SQL execution error: {e}\nGenerated SQL: {sql}"
        sql = None
        data = []

    # Visualization
    viz = None
    if data and len(data) > 0:
        cols = list(data[0].keys()) if data else []
        chart_type = _detect_chart_type(req.message, cols, data)
        if chart_type and chart_type != "metric":
            viz = _create_visualization(data, chart_type)

    # Generate natural language answer — only GPT-3.5 does a second LLM call.
    # For local Ollama models we skip it (CPU inference is slow; SQL result is already shown).
    if data and req.model == "gpt-3.5":
        try:
            nl_prompt = (
                f"The user asked: {req.message}\n"
                f"SQL result ({len(data)} rows): {str(data[:5])}\n"
                f"Provide a brief, insightful answer in 2-3 sentences."
            )
            nl_answer = _query_openai(nl_prompt)
            answer = nl_answer
            tokens_used += _count_tokens(nl_answer)
        except Exception:
            pass

    # Generate context-aware follow-up questions for this specific turn
    followups = _generate_followups(req.message, answer, schema)

    # General suggestions (refreshed each turn)
    suggestions = _generate_suggestions(schema)

    return {
        "answer": answer,
        "sql": sql,
        "data": data[:50],
        "visualization": viz,
        "tokens_used": tokens_used,
        "suggestions": suggestions,
        "followups": followups,
    }


@router.get("/chat/suggestions")
async def get_suggestions():
    state = _get_state()
    if not state.db_path:
        return {"suggestions": []}
    schema = _get_schema_info(state.db_path)
    return {"suggestions": _generate_suggestions(schema)}


@router.get("/chat/ollama/status")
async def get_ollama_status():
    """Check which local Ollama models are available and ready."""
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.get(f"{base_url}/api/tags")
            data = resp.json()
            pulled = [m["name"] for m in data.get("models", [])]
            statuses = {}
            for model_id, ollama_name in MODEL_TO_OLLAMA.items():
                # Match by prefix (e.g. "llama3.1:latest" matches "llama3.1:latest")
                ready = any(
                    p == ollama_name or p.startswith(ollama_name.split(":")[0])
                    for p in pulled
                )
                statuses[model_id] = {"ready": ready, "model": ollama_name}
            return {"ollama_running": True, "models": statuses}
    except Exception:
        return {
            "ollama_running": False,
            "models": {k: {"ready": False, "model": v} for k, v in MODEL_TO_OLLAMA.items()},
        }
