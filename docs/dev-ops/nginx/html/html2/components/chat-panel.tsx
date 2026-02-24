"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { Bot, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const API_BASE_URL = "http://localhost:8090/api/v1/ollama"
const DEFAULT_MODEL = "deepseek-r1:1.5b"

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [model, setModel] = useState(DEFAULT_MODEL)
  const scrollRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = useCallback(
    (content: string) => {
      if (isStreaming) return

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
      }

      const assistantId = (Date.now() + 1).toString()
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
      }

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setIsStreaming(true)

      const apiUrl = `${API_BASE_URL}/generate_stream?model=${encodeURIComponent(model)}&message=${encodeURIComponent(content)}`

      const eventSource = new EventSource(apiUrl)
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          // 检查结束标识
          if (data?.result?.metadata?.finishReason === "STOP") {
            eventSource.close()
            eventSourceRef.current = null
            setIsStreaming(false)
            return
          }

          // 从 result.output.content 获取文本
          const text = data?.result?.output?.content
          if (text) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: msg.content + text }
                  : msg
              )
            )
          }
        } catch {
          // 解析失败时忽略
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
        eventSourceRef.current = null
        setIsStreaming(false)
      }
    },
    [isStreaming, model]
  )

  const handleClear = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setMessages([])
    setIsStreaming(false)
  }, [])

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* 顶部栏 */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">AI Chat</h1>
            <p className="text-xs text-muted-foreground">
              {"Powered by "}
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={isStreaming}
                className="inline-block cursor-pointer bg-transparent text-xs font-medium text-primary underline-offset-2 outline-none hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="选择模型"
              >
                <option value="deepseek-r1:1.5b">deepseek-r1:1.5b</option>
                <option value="deepseek-r1:7b">deepseek-r1:7b</option>
                <option value="deepseek-r1:8b">deepseek-r1:8b</option>
                <option value="qwen2:7b">qwen2:7b</option>
                <option value="llama3:8b">llama3:8b</option>
              </select>
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          disabled={messages.length === 0 && !isStreaming}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="清空对话"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </header>

      {/* 消息区域 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <Bot className="h-7 w-7 text-secondary-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                你好，有什么可以帮你的吗？
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                输入消息开始对话
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl py-4">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                isStreaming={isStreaming && msg.role === "assistant" && msg === messages[messages.length - 1]}
              />
            ))}
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="shrink-0 border-t border-border bg-background px-4 py-3 lg:px-6">
        <div className="mx-auto max-w-3xl">
          <ChatInput onSend={handleSend} disabled={isStreaming} />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {"AI 生成的内容可能存在错误，请注意甄别"}
          </p>
        </div>
      </div>
    </div>
  )
}
