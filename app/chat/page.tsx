"use client"

import { useRef, useEffect, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { useSession, signIn } from "next-auth/react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, User, Bot, Sparkles, Lock, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ChatPage() {
  const { data: session, status: authStatus } = useSession()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Manual input state management
  const [input, setInput] = useState("")

  // useChat from @ai-sdk/react v3 returns limited helpers
  const { messages, status, sendMessage } = useChat({
    // @ts-ignore - api property might be typed differently in v6
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Hi! I'm Adelia, your AdPress assistant. Ask me about creating ads, tracking performance, or HTML5 ad concepts!",
      },
    ],
  })

  // Derived loading state
  const isLoading = status === "streaming" || status === "submitted"

  // Handle manual input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  // Handle manual submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    // sendMessage handles the request
    await sendMessage?.({ role: "user", content: input } as any)

    setInput("")
  }

  // Auto-scroll logic
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, isLoading])

  // Submit on Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (authStatus === "loading") {
    return <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white">Loading...</div>
  }

  if (!session) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-950">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="bg-neutral-900 p-8 rounded-2xl shadow-sm border border-white/10">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Sign in to Chat</h1>
              <p className="text-neutral-400 mb-6">
                Please sign in to access Adelia, your personal ad creation assistant.
              </p>
              <Button size="lg" className="w-full" onClick={() => signIn()}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-950">
      <Navbar />

      <main className="flex-1 container max-w-4xl mx-auto p-4 md:p-6 flex flex-col h-[calc(100vh-64px)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Adelia Assistant</h1>
            <p className="text-sm text-neutral-400">Expert on AdPress, ad tech, and creative development</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-neutral-900 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-6 pb-4">
              {messages.map((message: any) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar className="w-8 h-8 border border-white/10">
                    {message.role === "user" ? (
                      <>
                        <AvatarImage src={session.user?.image || ""} />
                        <AvatarFallback className="bg-neutral-800 text-white"><User className="w-4 h-4" /></AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="bg-blue-500/10 text-blue-500">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className={`flex flex-col max-w-[80%] ${message.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${message.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-neutral-800 text-neutral-200 rounded-tl-none border border-white/5"
                        }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4">
                  <Avatar className="w-8 h-8 border border-white/10">
                    <AvatarFallback className="bg-blue-500/10 text-blue-500">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-neutral-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 border border-white/5">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 bg-neutral-900 border-t border-white/10">
            <Alert className="mb-4 bg-blue-500/10 border-blue-500/20 text-blue-400">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-blue-400 font-semibold">Restricted Access</AlertTitle>
              <AlertDescription className="text-blue-400/90 text-xs">
                I can only answer questions about Adelia features, advertising concepts, and ad creation.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="relative">
              <Textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask Adelia about ad formats, tracking scripts, or platform tools..."
                className="min-h-[60px] w-full resize-none pr-14 py-3 px-4 rounded-xl bg-neutral-950 border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-blue-500/20"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
