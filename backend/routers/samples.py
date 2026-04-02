"""Sample datasets router — provides built-in demo datasets."""

import io
import sqlite3
import tempfile

import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException

router = APIRouter()

# ── Seeded random for reproducible sample data ──
rng = np.random.default_rng(42)


def _build_titanic() -> pd.DataFrame:
    n = 100
    survived = rng.choice([0, 1], size=n, p=[0.62, 0.38])
    pclass = rng.choice([1, 2, 3], size=n, p=[0.24, 0.21, 0.55])
    sex = rng.choice(["male", "female"], size=n, p=[0.65, 0.35])
    age = np.where(
        rng.random(n) < 0.2, np.nan,
        rng.normal(29.7, 14.5, n).clip(1, 80).round(1)
    )
    sibsp = rng.choice([0, 1, 2, 3, 4], size=n, p=[0.68, 0.23, 0.06, 0.02, 0.01])
    parch = rng.choice([0, 1, 2, 3], size=n, p=[0.76, 0.13, 0.09, 0.02])
    fare_base = {1: 84.2, 2: 20.7, 3: 13.7}
    fare = np.array([
        round(max(0, rng.normal(fare_base[pclass[i]], 30)), 2) for i in range(n)
    ])
    embarked = rng.choice(["S", "C", "Q"], size=n, p=[0.72, 0.19, 0.09])

    # Fare correlation with class/survival
    fare[survived == 1] *= 1.3
    fare = fare.round(2)

    return pd.DataFrame({
        "PassengerId": range(1, n + 1),
        "Survived": survived,
        "Pclass": pclass,
        "Sex": sex,
        "Age": age,
        "SibSp": sibsp,
        "Parch": parch,
        "Fare": fare,
        "Embarked": embarked,
    })


def _build_iris() -> pd.DataFrame:
    n_per = 50
    species_data = [
        ("setosa",     [5.006, 3.428, 1.462, 0.246], [0.35, 0.38, 0.17, 0.11]),
        ("versicolor", [5.936, 2.770, 4.260, 1.326], [0.52, 0.31, 0.47, 0.20]),
        ("virginica",  [6.588, 2.974, 5.552, 2.026], [0.64, 0.32, 0.55, 0.27]),
    ]
    rows = []
    for name, means, stds in species_data:
        sl = rng.normal(means[0], stds[0], n_per).round(1).clip(4.0, 8.0)
        sw = rng.normal(means[1], stds[1], n_per).round(1).clip(2.0, 4.5)
        pl = rng.normal(means[2], stds[2], n_per).round(1).clip(1.0, 7.0)
        pw = rng.normal(means[3], stds[3], n_per).round(1).clip(0.1, 2.5)
        for i in range(n_per):
            rows.append([sl[i], sw[i], pl[i], pw[i], name])
    df = pd.DataFrame(rows, columns=["SepalLength", "SepalWidth", "PetalLength", "PetalWidth", "Species"])
    return df.sample(frac=1, random_state=42).reset_index(drop=True)


def _build_sales() -> pd.DataFrame:
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    products = ["Laptop", "Smartphone", "Tablet", "Monitor", "Headphones",
                "Keyboard", "Mouse", "Webcam", "SSD", "GPU"]
    categories = {
        "Laptop": "Computing", "Smartphone": "Mobile", "Tablet": "Mobile",
        "Monitor": "Computing", "Headphones": "Audio", "Keyboard": "Peripherals",
        "Mouse": "Peripherals", "Webcam": "Peripherals", "SSD": "Storage", "GPU": "Computing"
    }
    regions = ["North", "South", "East", "West"]
    base_prices = {
        "Laptop": 1200, "Smartphone": 800, "Tablet": 500, "Monitor": 350,
        "Headphones": 150, "Keyboard": 80, "Mouse": 50, "Webcam": 90,
        "SSD": 120, "GPU": 600
    }

    rows = []
    for month_idx, month in enumerate(months):
        for product in products:
            for region in regions:
                trend = 1 + month_idx * 0.02
                seasonality = 1.3 if month in ["Nov", "Dec"] else (0.85 if month in ["Jan", "Feb"] else 1.0)
                units = int(max(5, rng.normal(40, 12) * trend * seasonality))
                price = base_prices[product] * rng.uniform(0.92, 1.08)
                revenue = round(units * price, 2)
                margin = rng.uniform(0.15, 0.35)
                profit = round(revenue * margin, 2)
                rows.append({
                    "Month": month,
                    "Month_Num": month_idx + 1,
                    "Product": product,
                    "Category": categories[product],
                    "Region": region,
                    "Units_Sold": units,
                    "Revenue": revenue,
                    "Profit": profit,
                    "Margin_Pct": round(margin * 100, 1),
                })

    return pd.DataFrame(rows)


SAMPLES = {
    "titanic": {
        "name": "Titanic Passengers",
        "description": "Survival prediction dataset with demographic and ticket information",
        "rows": 100,
        "columns": 9,
        "tags": ["Classification", "Demographics"],
        "color": "blue",
        "builder": _build_titanic,
    },
    "iris": {
        "name": "Iris Flowers",
        "description": "Classic multi-class classification with 4 numeric measurements",
        "rows": 150,
        "columns": 5,
        "tags": ["Classification", "Biology"],
        "color": "green",
        "builder": _build_iris,
    },
    "sales": {
        "name": "Monthly Sales",
        "description": "Synthetic retail dataset with revenue, profit and regional breakdowns",
        "rows": 480,
        "columns": 9,
        "tags": ["Regression", "Business"],
        "color": "purple",
        "builder": _build_sales,
    },
}


def _get_state():
    from main import get_state
    return get_state()


def _df_to_state(df: pd.DataFrame, name: str):
    """Load a DataFrame into app state and return DatasetInfo dict."""
    state = _get_state()
    state.df = df
    state.filename = name

    # Build SQLite DB for chat queries
    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    conn = sqlite3.connect(tmp.name)
    df.to_sql("data", conn, if_exists="replace", index=False)
    conn.close()
    state.db_path = tmp.name

    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = df.select_dtypes(exclude="number").columns.tolist()
    total_cells = df.shape[0] * df.shape[1]
    missing_cells = int(df.isnull().sum().sum())
    missing_pct = round(missing_cells / total_cells * 100, 1) if total_cells else 0

    return {
        "filename": name,
        "rows": len(df),
        "columns": len(df.columns),
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
        "column_types": {c: str(t) for c, t in df.dtypes.items()},
        "missing_pct": missing_pct,
        "preview": df.head(50).fillna("").to_dict(orient="records"),
    }


@router.get("/samples")
async def list_samples():
    return [
        {
            "id": key,
            "name": meta["name"],
            "description": meta["description"],
            "rows": meta["rows"],
            "columns": meta["columns"],
            "tags": meta["tags"],
            "color": meta["color"],
        }
        for key, meta in SAMPLES.items()
    ]


@router.post("/samples/{sample_id}")
async def load_sample(sample_id: str):
    if sample_id not in SAMPLES:
        raise HTTPException(404, f"Sample '{sample_id}' not found")
    meta = SAMPLES[sample_id]
    df = meta["builder"]()
    return _df_to_state(df, f"{meta['name']}.csv")


@router.get("/predict/suggest")
async def suggest_targets():
    """Suggest top 3 prediction target columns with reasons."""
    state = _get_state()
    df = state.df
    if df is None:
        raise HTTPException(400, "No dataset loaded")

    numeric = df.select_dtypes(include="number")
    suggestions = []

    for col in numeric.columns:
        series = df[col].dropna()
        if len(series) < 10:
            continue

        unique_count = series.nunique()
        col_lower = col.lower()

        # Skip obvious ID/index columns
        if col_lower in ("id", "index", "passengerid", "row_id", "record_id") or col_lower.endswith("_id"):
            continue

        reason = ""
        score = 0

        if unique_count == 2:
            pos_rate = round(float(series.mean() * 100), 1)
            reason = f"Binary outcome ({pos_rate}% positive rate) — ideal for classification"
            score = 100
        elif unique_count <= 10:
            reason = f"Low-cardinality numeric ({unique_count} unique values) — good classification target"
            score = 80
        else:
            std = float(series.std())
            mean = float(series.mean())
            cv = (std / mean * 100) if mean != 0 else 0
            missing_pct = round(df[col].isnull().sum() / len(df) * 100, 1)
            reason = f"Continuous target (mean={mean:.1f}, σ={std:.1f}, CV={cv:.0f}%) — suitable for regression"
            if missing_pct > 0:
                reason += f" — {missing_pct}% missing values"
            score = min(70, int(cv))

        suggestions.append({"column": col, "reason": reason, "score": score})

    suggestions.sort(key=lambda x: x["score"], reverse=True)
    return {"suggestions": suggestions[:3]}
