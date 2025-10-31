import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  try {
    const { prompt, model, type = 'text' } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Handle image generation
    if (type === 'image') {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })

      // Map model names to OpenAI image models
      let imageModel = 'dall-e-3'
      if (model === 'dall-e-2') imageModel = 'dall-e-2'
      else if (model === 'gpt-image-1') imageModel = 'dall-e-3' // Map gpt-image-1 to dall-e-3 for now

      const imageResponse = await openai.images.generate({
        model: imageModel,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      })

      return NextResponse.json({
        imageUrl: imageResponse.data[0].url,
        url: imageResponse.data[0].url,
        image: imageResponse.data[0].url
      })
    }

    // Handle text generation
    // Check if it's a Claude model
    if (model?.startsWith('claude-')) {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })

      // Map model names
      let claudeModel = 'claude-3-5-sonnet-20241022'
      if (model === 'claude-3-opus') claudeModel = 'claude-3-opus-20240229'
      else if (model === 'claude-3-haiku') claudeModel = 'claude-3-haiku-20240307'

      const message = await anthropic.messages.create({
        model: claudeModel,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      })

      const content = message.content[0]
      const text = content.type === 'text' ? content.text : ''

      return NextResponse.json({ response: text, content: text })
    }

    // Handle OpenAI text models
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Map model names to OpenAI models
    let openaiModel = 'gpt-4o'
    if (model === 'gpt-4o-mini') openaiModel = 'gpt-4o-mini'
    else if (model === 'gpt-4-turbo') openaiModel = 'gpt-4-turbo-preview'
    else if (model === 'gpt-4') openaiModel = 'gpt-4'
    else if (model === 'gpt-3.5-turbo') openaiModel = 'gpt-3.5-turbo'

    const completion = await openai.chat.completions.create({
      model: openaiModel,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4096,
    })

    return NextResponse.json({
      response: completion.choices[0].message.content,
      content: completion.choices[0].message.content
    })

  } catch (error: any) {
    console.error('AI API Error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}
