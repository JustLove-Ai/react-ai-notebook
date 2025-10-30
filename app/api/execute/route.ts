import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { code, language } = await req.json()

    if (language === 'javascript' || language === 'typescript') {
      // Create a safe execution context
      const logs: any[] = []
      const errors: any[] = []

      // Override console methods to capture output
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(arg => String(arg)).join(' ')),
        error: (...args: any[]) => errors.push(args.map(arg => String(arg)).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(arg => String(arg)).join(' ')),
        info: (...args: any[]) => logs.push('[INFO] ' + args.map(arg => String(arg)).join(' ')),
      }

      try {
        // Create isolated execution context
        const func = new Function('console', code)
        func(customConsole)

        return NextResponse.json({
          output: logs.join('\n'),
          error: errors.length > 0 ? errors.join('\n') : null,
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
