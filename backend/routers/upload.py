"""Upload router — handles CSV/TSV/XLSX upload and dataset info."""

import io
import sqlite3
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, File, UploadFile, HTTPException

router = APIRouter()


def _get_state():
    from main import get_state
    return get_state()


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    state = _get_state()

    ext = Path(file.filename or "").suffix.lower()
    content = await file.read()

    try:
        if ext == ".csv":
            df = pd.read_csv(io.BytesIO(content), low_memory=False)
        elif ext == ".tsv":
            df = pd.read_csv(io.BytesIO(content), sep="\t", low_memory=False)
        elif ext in (".xlsx", ".xls"):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(400, f"Unsupported file type: {ext}")
    except Exception as e:
        raise HTTPException(400, f"Failed to parse file: {e}")

    state.df = df
    state.filename = file.filename or "dataset"

    # Create SQLite for chatbot
    db_path = "/tmp/datalens_chat.db"
    conn = sqlite3.connect(db_path)
    table_name = "data"
    df.to_sql(table_name, conn, if_exists="replace", index=False)
    conn.close()
    state.db_path = db_path

    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    cat_cols = df.select_dtypes(exclude="number").columns.tolist()
    col_types = {c: str(df[c].dtype) for c in df.columns}
    total_cells = df.shape[0] * df.shape[1]
    missing_cells = int(df.isnull().sum().sum())
    completeness = round((1 - missing_cells / total_cells) * 100, 1) if total_cells else 100.0

    preview = df.head(50).fillna("").to_dict(orient="records")

    return {
        "filename": state.filename,
        "rows": len(df),
        "columns": len(df.columns),
        "numeric_columns": numeric_cols,
        "categorical_columns": cat_cols,
        "column_types": col_types,
        "missing_pct": completeness,
        "preview": preview,
    }
