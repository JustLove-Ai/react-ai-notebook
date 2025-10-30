// Helper functions for creating charts in notebook cells
// Users can call these functions from their code cells

export interface ChartData {
  type: 'line' | 'bar' | 'area' | 'pie'
  data: any[]
  xKey?: string
  yKey?: string
  title?: string
}

export function createChart(config: ChartData): string {
  // Return a JSON marker that the frontend can detect and render
  return `__CHART__${JSON.stringify(config)}__CHART__`
}

export function lineChart(data: any[], xKey: string, yKey: string, title?: string): string {
  return createChart({ type: 'line', data, xKey, yKey, title })
}

export function barChart(data: any[], xKey: string, yKey: string, title?: string): string {
  return createChart({ type: 'bar', data, xKey, yKey, title })
}

export function areaChart(data: any[], xKey: string, yKey: string, title?: string): string {
  return createChart({ type: 'area', data, xKey, yKey, title })
}

export function pieChart(data: any[], nameKey: string, valueKey: string, title?: string): string {
  return createChart({ type: 'pie', data, xKey: nameKey, yKey: valueKey, title })
}
