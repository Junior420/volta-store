# Ardhi Analytics — Phase 0

Real estate finance & investment analysis platform, Tanzania-first.
Blueprint: [`docs/real-estate-finance-platform/BLUEPRINT.md`](../docs/real-estate-finance-platform/BLUEPRINT.md).

> This directory is a self-contained project scaffolded inside the volta-store
> workspace; it shares no code with the store and is designed to be extracted
> into its own repository (`git filter-repo --path ardhi/` or copy the tree).

## What works now (Phase 0 milestone)

Enter a rental/commercial property deal → one click →

- Full multi-year pro forma (rent growth, vacancy, opex, capex reserves)
- Levered & unlevered IRR, NPV, equity multiple, cash-on-cash, DSCR, LTV,
  debt yield, cap rate, GRM, break-even occupancy
- Amortization-aware mortgage modeling (incl. interest-only phases)
- Exit modeling at a forward exit cap rate with loan payoff
- Tanzania rule pack v1 (draft): stamp duty, CGT single instalment,
  rent withholding tax, transfer procedure checklist, tenure/foreign-buyer
  compliance flags
- One-click PDF investment appraisal report (with scenario & sensitivity sections)
- Scenario comparison (pessimistic / base / optimistic) and one-way + two-way
  sensitivity analysis (`/api/scenarios`, `/api/sensitivity`)
- Valuation engine: income approach (direct cap + DCF) and sales comparison
  with adjustment grids and cross-approach reconciliation (`/api/valuation`)
- Saved deals (SQLite, `/api/deals` CRUD)
- Simple web UI (no build step)

## Run it

```bash
cd ardhi/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# open http://127.0.0.1:8000
```

## Test it

```bash
cd ardhi/backend
pytest
```

`finance_core/` is a pure calculation library — no I/O, no framework — with
golden tests verified against Excel and published amortization tables. Treat
it as the crown jewel: every new formula lands with a golden test.

## Layout

```
ardhi/backend/
  finance_core/   pure finance math (tvm, loans, metrics, pro formas)
  app/            FastAPI API + web UI + PDF reports
    rulepack.py   loads/evaluates jurisdiction rule packs
  rulepacks/      versioned YAML rule packs (tz_v1.yaml — DRAFT)
  tests/          golden + API tests
```

## Important caveats

- **The Tanzania rule pack is a draft.** Every rate (stamp duty, CGT, WHT,
  fees) must be verified against current TRA/Ministry of Lands practice by a
  qualified professional before reliance. The pack carries `verify: true`
  markers and effective dates for this purpose.
- Output is analysis, not legal/tax/investment advice; statutory valuations
  require a registered valuer's sign-off.

## Next (from the blueprint)

Remaining Phase 1: BOT/NBS live data connectors, comparables database with
contribution workflow, auth & multi-user, report templates for valuers and
banks, Monte Carlo simulation, Swahili localization.
