// --- chartWidget.js ---
export class ChartWidget {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.chart = null;
  }
  render(dataSets, labels) {
    if (this.chart) this.chart.destroy();
    this.chart = new Chart(this.ctx, {
      ...this.config,
      data: { labels, datasets: dataSets }
    });
  }
}