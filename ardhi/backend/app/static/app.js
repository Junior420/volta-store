const form = document.getElementById("dealForm");
const errBox = document.getElementById("error");
const pctFields = ["vacancy_rate", "rent_growth", "expense_growth", "exit_cap_rate",
                   "selling_costs_rate", "discount_rate", "ltv", "annual_rate"];

document.getElementById("useLoan").addEventListener("change", (e) => {
  document.getElementById("loanFields").style.display = e.target.checked ? "" : "none";
});

function collectDeal() {
  const f = new FormData(form);
  const num = (k) => parseFloat(f.get(k));
  const pct = (k) => num(k) / 100;
  const deal = {
    name: f.get("name") || "Untitled deal",
    jurisdiction: "tz",
    currency: "TZS",
    use: f.get("use"),
    tenure: f.get("tenure"),
    buyer_resident: document.getElementById("buyerResident").checked,
    is_crowdfunded: document.getElementById("isCrowdfunded").checked,
    purchase_price: num("purchase_price"),
    gross_rent_annual: num("gross_rent_annual"),
    vacancy_rate: pct("vacancy_rate"),
    operating_expenses_annual: num("operating_expenses_annual"),
    rent_growth: pct("rent_growth"),
    expense_growth: pct("expense_growth"),
    hold_years: parseInt(f.get("hold_years"), 10),
    exit_cap_rate: pct("exit_cap_rate"),
    selling_costs_rate: pct("selling_costs_rate"),
    discount_rate: pct("discount_rate"),
  };
  if (document.getElementById("useLoan").checked) {
    deal.loan = {
      ltv: pct("ltv"),
      annual_rate: pct("annual_rate"),
      term_years: num("term_years"),
      interest_only_years: num("interest_only_years") || 0,
    };
  }
  return deal;
}

const fmt = (v) => "TZS " + Math.round(v).toLocaleString("en-US");
const pctFmt = (v) => v == null ? "n/a" : (v * 100).toFixed(2) + "%";

function tile(label, value) {
  return `<div class="tile"><div class="k">${label}</div><div class="v">${value}</div></div>`;
}

function render(r) {
  const m = r.metrics;
  let tiles = [
    tile("Levered IRR", pctFmt(m.levered_irr)),
    tile("Unlevered IRR", pctFmt(m.unlevered_irr)),
    tile("Entry cap rate", pctFmt(m.entry_cap_rate)),
    tile("Equity multiple", m.equity_multiple.toFixed(2) + "x"),
    tile("Cash-on-cash (yr 1)", pctFmt(m.cash_on_cash_year1)),
    tile("NPV (levered)", fmt(m.levered_npv)),
    tile("NOI (yr 1)", fmt(m.noi_year1)),
    tile("Equity invested", fmt(m.equity_invested)),
  ];
  if (m.dscr_year1 !== undefined) {
    tiles.push(tile("DSCR (yr 1)", m.dscr_year1.toFixed(2)),
               tile("LTV", pctFmt(m.ltv)),
               tile("Debt yield", pctFmt(m.debt_yield)),
               tile("Break-even occupancy", pctFmt(m.break_even_occupancy)));
  }
  document.getElementById("tiles").innerHTML = tiles.join("");

  const head = "<tr><th>Year</th><th>GPI</th><th>EGI</th><th>Opex</th><th>NOI</th><th>Debt svc</th><th>Cash flow</th></tr>";
  const rows = r.years.map((y) =>
    `<tr><td>${y.year}</td><td>${fmt(y.gross_potential_income)}</td><td>${fmt(y.effective_gross_income)}</td>` +
    `<td>${fmt(y.operating_expenses)}</td><td>${fmt(y.noi)}</td><td>${fmt(y.debt_service)}</td>` +
    `<td>${fmt(y.cash_flow_after_debt)}</td></tr>`).join("");
  document.getElementById("cfTable").innerHTML = head + rows;

  document.getElementById("exitTiles").innerHTML = [
    tile(`Gross sale price (yr ${r.sale.year})`, fmt(r.sale.gross_sale_price)),
    tile("Net proceeds to equity", fmt(r.sale.net_sale_proceeds_levered)),
    tile("Loan payoff", fmt(r.sale.loan_payoff)),
    tile(`Est. CGT (${pctFmt(r.disposal_taxes.cgt_rate)})`, fmt(r.disposal_taxes.capital_gains_tax)),
    tile("Stamp duty (acq.)", fmt(r.acquisition_costs.stamp_duty)),
    tile("Total acquisition costs", fmt(r.acquisition_costs.total)),
    tile(`Rent WHT / yr (${pctFmt(r.rental_withholding.rate)})`, fmt(r.rental_withholding.annual_withholding)),
  ].join("");

  document.getElementById("flags").innerHTML =
    r.compliance_flags.map((f) => `<li>${f.message}</li>`).join("");
  document.getElementById("steps").innerHTML =
    r.procedure_steps.map((s) => `<li>${s.step} (~${s.typical_days} days)</li>`).join("");
  document.getElementById("disclaimer").textContent =
    `Rule pack: ${r.rulepack.jurisdiction} v${r.rulepack.version} (${r.rulepack.status}, reviewed ${r.rulepack.last_reviewed}). ${r.disclaimer}`;

  document.getElementById("placeholderCard").style.display = "none";
  document.getElementById("results").classList.add("visible");
}

async function post(path) {
  errBox.textContent = "";
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(collectDeal()),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail || res.statusText));
  }
  return res;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("analyzeBtn");
  btn.disabled = true;
  try {
    render(await (await post("/api/analyze")).json());
  } catch (err) {
    errBox.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

document.getElementById("pdfBtn").addEventListener("click", async () => {
  const btn = document.getElementById("pdfBtn");
  btn.disabled = true;
  try {
    const res = await post("/api/report");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (collectDeal().name || "deal").replace(/\s+/g, "_") + "_appraisal.pdf";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    errBox.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});
