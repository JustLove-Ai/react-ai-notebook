'use client'

import { Button } from './ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'
import { HelpCircle } from 'lucide-react'

export function MarkdownTipsPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2" title="Markdown tips">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm mb-3">Markdown Syntax</h4>

          <div className="text-xs space-y-2">
            <div>
              <div className="font-mono bg-neutral-100 dark:bg-neutral-800 p-1 rounded mb-1">
                # Heading 1
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">Large heading</div>
            </div>

            <div>
              <div className="font-mono bg-neutral-100 dark:bg-neutral-800 p-1 rounded mb-1">
                ## Heading 2
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">Medium heading</div>
            </div>

            <div>
              <div className="font-mono bg-neutral-100 dark:bg-neutral-800 p-1 rounded mb-1">
                **bold text**
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">Bold formatting</div>
            </div>

            <div>
              <div className="font-mono bg-neutral-100 dark:bg-neutral-800 p-1 rounded mb-1">
                *italic text*
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">Italic formatting</div>
            </div>

            <div>
              <div className="font-mono bg-neutral-100 dark:bg-neutral-800 p-1 rounded mb-1">
                `code`
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">Inline code</div>
            </div>

            <div>
              <div className="font-mono bg-neutral-100 dark:bg-neutral-800 p-1 rounded mb-1">
                ```<br />code block<br />```
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">Code block</div>
            </div>

            <div>
              <div className="font-mono bg-neutral-100 dark:bg-neutral-800 p-1 rounded mb-1">
                - List item<br />- Another item
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">Bullet list</div>
            </div>

            <div>
              <div className="font-mono bg-neutral-100 dark:bg-neutral-800 p-1 rounded mb-1">
                1. First<br />2. Second
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">Numbered list</div>
            </div>

            <div>
              <div className="font-mono bg-neutral-100 dark:bg-neutral-800 p-1 rounded mb-1">
                [link text](url)
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">Hyperlink</div>
            </div>

            <div>
              <div className="font-mono bg-neutral-100 dark:bg-neutral-800 p-1 rounded mb-1">
                > blockquote
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">Quote</div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
