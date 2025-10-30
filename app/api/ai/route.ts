import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = 'claude', context } = await req.json()

    if (model === 'claude') {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: context ? `Context:\n${context}\n\nPrompt:\n${prompt}` : prompt
          }
        ],
      })

      const content = message.content[0]
      const text = content.type === 'text' ? content.text : ''

      return NextResponse.json({ response: text })
    } else if (model === 'openai') {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'user',
            content: context ? `Context:\n${context}\n\nPrompt:\n${prompt}` : prompt
          }
        ],
        max_tokens: 4096,
      })

      return NextResponse.json({ response: completion.choices[0].message.content })
    }

    return NextResponse.json({ error: 'Invalid model' }, { status: 400 })
  } catch (error: any) {
    console.error('AI API Error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}
