"""finance_core — pure, deterministic real estate finance calculations.

No I/O, no framework imports. Every public function is unit-tested against
independently verified golden values (Excel / HP-12C / published tables).
"""

from .tvm import npv, irr, xnpv, xirr, mirr
from .loans import payment, amortization_schedule, remaining_balance, annual_debt_service
from .metrics import (
    noi,
    cap_rate,
    gross_rent_multiplier,
    dscr,
    ltv,
    debt_yield,
    cash_on_cash,
    equity_multiple,
    operating_expense_ratio,
    break_even_occupancy,
)
from .projections import build_pro_forma

__all__ = [
    "npv", "irr", "xnpv", "xirr", "mirr",
    "payment", "amortization_schedule", "remaining_balance", "annual_debt_service",
    "noi", "cap_rate", "gross_rent_multiplier", "dscr", "ltv", "debt_yield",
    "cash_on_cash", "equity_multiple", "operating_expense_ratio", "break_even_occupancy",
    "build_pro_forma",
]
