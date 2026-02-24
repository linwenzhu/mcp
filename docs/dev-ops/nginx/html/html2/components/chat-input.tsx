"use client"

import { SendHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, type KeyboardEvent, type FormEvent } from "react"

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = textareaRef.current?.value.trim()
    if (!value) return
    onSend(value)
    if (textareaRef.current) {
      textareaRef.current.value = ""
      textareaRef.current.style.height = "auto"
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  function handleInput() {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px"
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          placeholder="输入消息..."
          rows={1}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 pr-12 text-sm leading-relaxed text-card-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="消息输入框"
        />
        <Button
          type="submit"
          size="icon"
          disabled={disabled}
          className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-lg"
          aria-label="发送消息"
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
