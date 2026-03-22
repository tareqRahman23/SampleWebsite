const MONTHS = ["Apr'26","May'26","Jun'26","Jul'26","Aug'26","Sep'26","Oct'26","Nov'26","Dec'26","Jan'27","Feb'27","Mar'27"];
let cashChart, netChart, inoutChart, costPieChart;

function fmt(n) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e7) return sign + "৳" + (abs/1e7).toFixed(2) + " Cr";
  if (abs >= 1e5) return sign + "৳" + (abs/1e5).toFixed(2) + " L";
  return sign + "৳" + Math.round(abs).toLocaleString();
}
function fmtShort(n) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e7) return sign + (abs/1e7).toFixed(1) + "Cr";
  if (abs >= 1e5) return sign + (abs/1e5).toFixed(1) + "L";
  return sign + Math.round(abs).toLocaleString();
}

function readInputs() {
  return {
    fx:             parseFloat(document.getElementById("fx_rate").value),
    fiverrGrossUSD: parseFloat(document.getElementById("fiverr_gross").value),
    directStart:    parseFloat(document.getElementById("direct_aug").value),
    directGrowth:   parseFloat(document.getElementById("direct_growth").value),
    devSalary:      parseFloat(document.getElementById("dev_salary").value),
    augDevs:        parseInt(document.getElementById("aug_devs").value),
    hireCadence:    parseInt(document.getElementById("hire_cadence").value),
    founderSal:     parseFloat(document.getElementById("founder_sal").value),
    founderStart:   parseInt(document.getElementById("founder_start").value),
    officeCost:     parseFloat(document.getElementById("office_cost").value),
    softwareCost:   parseFloat(document.getElementById("software_cost").value),
    protoCost:      parseFloat(document.getElementById("proto_cost").value),
    startFundUSD:   parseFloat(document.getElementById("start_fund").value),
  };
}

function updateLabels(inp) {
  document.getElementById("val_fiverr").textContent        = "$" + inp.fiverrGrossUSD.toLocaleString();
  document.getElementById("val_direct").textContent        = "৳" + inp.directStart.toLocaleString();
  document.getElementById("val_direct_growth").textContent = "৳" + inp.directGrowth.toLocaleString();
  document.getElementById("val_dev_salary").textContent    = "৳" + inp.devSalary.toLocaleString();
  document.getElementById("val_aug_devs").textContent      = inp.augDevs;
  document.getElementById("val_hire_cadence").textContent  = inp.hireCadence;
  document.getElementById("val_founder_sal").textContent   = "৳" + inp.founderSal.toLocaleString();
  document.getElementById("val_founder_start").textContent = inp.founderStart;
  document.getElementById("val_office").textContent        = "৳" + inp.officeCost.toLocaleString();
  document.getElementById("val_software").textContent      = "৳" + inp.softwareCost.toLocaleString();
  document.getElementById("val_proto").textContent         = "৳" + inp.protoCost.toLocaleString();
  document.getElementById("val_fund").textContent          = "$" + inp.startFundUSD.toLocaleString();
  document.getElementById("val_fx").textContent            = inp.fx.toFixed(2);
}

function calculate(inp) {
  const fiverrNetBDT = inp.fiverrGrossUSD * 0.80 * inp.fx;
  const startBDT = inp.startFundUSD * inp.fx;

  let cash = startBDT;
  let minCash = cash;
  let breakevenIdx = null;

  let totPayroll = 0, totFounder = 0, totOffice = 0, totSoftware = 0, totProto = 0;

  const rows = [];

  for (let i = 0; i < 12; i++) {
    let devs = 0;
    if (i >= 4) {
      const extra = Math.floor((i - 4) / inp.hireCadence);
      devs = Math.min(inp.augDevs + extra, 7);
    }

    const directBDT = i >= 4 ? inp.directStart + (i - 4) * inp.directGrowth : 0;
    const inflow = fiverrNetBDT + directBDT;

    const payroll  = devs * inp.devSalary;
    const founder  = (i >= inp.founderStart - 1) ? inp.founderSal : 0;
    const office   = (i >= 4) ? inp.officeCost : 0;
    const software = inp.softwareCost;
    const proto    = inp.protoCost;

    const outflow = payroll + founder + office + software + proto;
    const net = inflow - outflow;

    cash += net;
    if (cash < minCash) minCash = cash;
    if (breakevenIdx === null && inflow >= outflow) breakevenIdx = i;

    totPayroll  += payroll;
    totFounder  += founder;
    totOffice   += office;
    totSoftware += software;
    totProto    += proto;

    rows.push({ month: MONTHS[i], devs, inflow, outflow, net, cash });
  }

  return { rows, endCash: cash, minCash, breakevenIdx, totPayroll, totFounder, totOffice, totSoftware, totProto };
}

function updateOutcome(d) {
  const el = document.getElementById("outcome_text");
  if (d.minCash < 0) {
    el.textContent = "With the current settings the studio will run out of cash before the 12th month, so either hiring or founder draw needs to slow down or revenue must grow faster.";
  } else if (d.minCash < 200000) {
    el.textContent = "Cash stays positive but very tight, meaning any delay in Fiverr or direct-client payments could force you to delay salaries or cut prototype spending.";
  } else {
    el.textContent = "The studio remains comfortably cash-positive for the full year, giving you room to keep investing in prototypes and marketing while scaling the team gradually.";
  }
}

function updateKPIs(d) {
  document.getElementById("kpi_end_cash").textContent = fmt(d.endCash);
  document.getElementById("kpi_min_cash").textContent = fmt(d.minCash);
  document.getElementById("kpi_breakeven").textContent =
    d.breakevenIdx !== null ? MONTHS[d.breakevenIdx] : "Not reached";

  const badge = document.getElementById("status_badge");
  const text = document.getElementById("status_text");
  const dot = badge.querySelector(".status-dot");

  badge.classList.remove("status-safe","status-warn","status-danger");
  if (d.minCash < 0) {
    badge.classList.add("status-danger");
    text.textContent = "Critical";
    dot.style.background = "var(--danger)";
  } else if (d.minCash < 200000) {
    badge.classList.add("status-warn");
    text.textContent = "Tight";
    dot.style.background = "var(--warn)";
  } else {
    badge.classList.add("status-safe");
    text.textContent = "Stable";
    dot.style.background = "var(--safe)";
  }

  updateOutcome(d);
}

function baseOptions() {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { labels: { color: "#6b6f7a", font: { size: 10 } } },
      tooltip: { mode: "index", intersect: false }
    },
    scales: {
      x: {
        ticks: { color: "#6b6f7a", font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.04)" }
      },
      y: {
        ticks: {
          color: "#6b6f7a",
          font: { size: 10 },
          callback: (v) => v + "L"
        },
        grid: { color: "rgba(0,0,0,0.04)" }
      }
    }
  };
}

function updateCharts(d) {
  const cashL = d.rows.map(r => r.cash / 1e5);
  const netL  = d.rows.map(r => r.net  / 1e5);
  const inflL = d.rows.map(r => r.inflow  / 1e5);
  const outL  = d.rows.map(r => r.outflow / 1e5);

  if (cashChart) cashChart.destroy();
  cashChart = new Chart(document.getElementById("cashChart"), {
    type: "line",
    data: {
      labels: MONTHS,
      datasets: [{
        label: "Cash (Lakh BDT)",
        data: cashL,
        borderColor: "#e53935",
        backgroundColor: "rgba(229,57,53,0.12)",
        fill: true,
        tension: 0.3,
        pointRadius: 3
      }]
    },
    options: Object.assign({}, baseOptions(), { plugins: { legend: { display: false } } })
  });

  if (netChart) netChart.destroy();
  netChart = new Chart(document.getElementById("netChart"), {
    type: "bar",
    data: {
      labels: MONTHS,
      datasets: [{
        label: "Net (Lakh)",
        data: netL,
        backgroundColor: netL.map(v => v >= 0 ? "rgba(46,125,50,0.85)" : "rgba(229,57,53,0.85)")
      }]
    },
    options: Object.assign({}, baseOptions(), { plugins: { legend: { display: false } } })
  });

  if (inoutChart) inoutChart.destroy();
  inoutChart = new Chart(document.getElementById("inoutChart"), {
    type: "bar",
    data: {
      labels: MONTHS,
      datasets: [
        { label: "Inflow",  data: inflL, backgroundColor: "rgba(17,17,17,0.3)" },
        { label: "Outflow", data: outL,  backgroundColor: "rgba(229,57,53,0.8)" }
      ]
    },
    options: baseOptions()
  });

  const costData = [d.totPayroll, d.totFounder, d.totOffice, d.totSoftware, d.totProto].map(v => v/1e5);
  if (costPieChart) costPieChart.destroy();
  costPieChart = new Chart(document.getElementById("costPieChart"), {
    type: "doughnut",
    data: {
      labels: ["Dev payroll","Founder draw","Office","Software","Proto/marketing"],
      datasets: [{
        data: costData,
        backgroundColor: [
          "rgba(229,57,53,0.9)",
          "rgba(249,168,37,0.9)",
          "rgba(158,158,158,0.9)",
          "rgba(189,189,189,0.9)",
          "rgba(224,224,224,0.9)"
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: "#6b6f7a", font: { size: 10 } } }
      }
    }
  });
}

function updateTable(rows) {
  const body = document.getElementById("cashflow_table");
  body.innerHTML = rows.map(r => {
    const nc = r.net >= 0 ? "td-pos" : "td-neg";
    const cc = r.cash < 0 ? "td-neg" : (r.cash < 200000 ? "td-warn" : "td-pos");
    return `
      <tr>
        <td>${r.month}</td>
        <td>${r.devs}</td>
        <td>${fmtShort(r.inflow)}</td>
        <td>${fmtShort(r.outflow)}</td>
        <td class="${nc}">${fmtShort(r.net)}</td>
        <td class="${cc}">${fmtShort(r.cash)}</td>
      </tr>`;
  }).join("");
}

function updateDashboard() {
  const inp = readInputs();
  updateLabels(inp);
  const d = calculate(inp);
  updateKPIs(d);
  updateCharts(d);
  updateTable(d.rows);
}

document.addEventListener("DOMContentLoaded", updateDashboard);
