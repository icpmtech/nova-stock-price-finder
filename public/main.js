
import { renderHeader }         from "./widgets/header/header.js";
import { renderSummaryCards }   from "./widgets/summary-cards/summary-cards.js";
import { renderPortfolioChart } from "./widgets/portfolio-chart/portfolio-chart.js";

window.addEventListener("DOMContentLoaded", async () => {
  await renderHeader();
  await renderSummaryCards();
  await renderPortfolioChart();
});
