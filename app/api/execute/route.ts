import { NextRequest, NextResponse } from 'next/server'

// Store execution contexts per tab (in-memory for now)
// In production, you might want to use Redis or similar
const executionContexts = new Map<string, any>()

// Chart helper functions available in all cells
function createChart(config: { type: string; data: any[]; xKey?: string; yKey?: string; title?: string }): string {
  return `__CHART__${JSON.stringify(config)}__CHART__`
}

const chartHelpers = {
  lineChart: (data: any[], xKey: string, yKey: string, title?: string) =>
    createChart({ type: 'line', data, xKey, yKey, title }),
  barChart: (data: any[], xKey: string, yKey: string, title?: string) =>
    createChart({ type: 'bar', data, xKey, yKey, title }),
  areaChart: (data: any[], xKey: string, yKey: string, title?: string) =>
    createChart({ type: 'area', data, xKey, yKey, title }),
  pieChart: (data: any[], nameKey: string, valueKey: string, title?: string) =>
    createChart({ type: 'pie', data, xKey: nameKey, yKey: valueKey, title }),
}

export async function POST(req: NextRequest) {
  try {
    const { code, language, tabId, reset } = await req.json()

    if (language === 'javascript' || language === 'typescript') {
      // Get or create execution context for this tab
      if (reset || !executionContexts.has(tabId)) {
        executionContexts.set(tabId, {})
      }
      const context = executionContexts.get(tabId)

      const logs: any[] = []
      const errors: any[] = []

      // Override console methods to capture output
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2)
            } catch {
              return String(arg)
            }
          }
          return String(arg)
        }).join(' ')),
        error: (...args: any[]) => errors.push(args.map(arg => String(arg)).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(arg => String(arg)).join(' ')),
        info: (...args: any[]) => logs.push('[INFO] ' + args.map(arg => String(arg)).join(' ')),
      }

      try {
        // Merge chart helpers into context
        const enrichedContext = { ...context, ...chartHelpers }

        // Create function with access to context and common utilities
        const func = new Function(
          'console',
          'context',
          `
            with(context) {
              ${code}
            }
          `
        )

        const result = func(customConsole, enrichedContext)

        // Capture the last expression result if no console output
        let output = logs.join('\n')
        if (result !== undefined && logs.length === 0) {
          if (typeof result === 'object') {
            try {
              output = JSON.stringify(result, null, 2)
            } catch {
              output = String(result)
            }
          } else {
            output = String(result)
          }
        }

        return NextResponse.json({
          output,
          error: errors.length > 0 ? errors.join('\n') : null,
          result: result !== undefined ? result : null,
        })
      } catch (error: any) {
        return NextResponse.json({
          output: logs.join('\n'),
          error: error.message,
        })
      }
    } else {
      return NextResponse.json({
        output: '',
        error: `Language "${language}" is not supported for server-side execution. Use the browser execution for this language.`,
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// Optional: Add endpoint to clear context
export async function DELETE(req: NextRequest) {
  try {
    const { tabId } = await req.json()
    if (tabId) {
      executionContexts.delete(tabId)
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'tabId required' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
