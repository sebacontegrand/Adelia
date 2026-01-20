"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send, Bot, User } from "lucide-react"

type Message = {
  id: number
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

const botResponses = [
  "I'm here to help! What would you like to know about our ad platform?",
  "That's a great question! Our platform supports Desktop, Mobile, and Video ad formats.",
  "You can create ads in various sizes. Check out our Formats page for all available options.",
  "The Ad Builder makes it easy to upload your creative and generate ads instantly.",
  "Need help with a specific feature? I'm here to assist you!",
  "Our platform is designed to make ad creation simple and efficient.",
]

export default function ChatPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your Adelia assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const storedAuth = window.localStorage.getItem("adelia_auth")
    if (storedAuth === "true") setIsAuthenticated(true)
  }, [])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    }, 1000)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <Card className="mx-auto max-w-2xl border-border bg-card p-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">Chat requiere login</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Para hablar con el asistente necesitas iniciar sesion.
            </p>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              onClick={() => router.push("/")}
            >
              Ir al login
            </button>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-balance">Chat Support</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground text-balance">
            Get instant answers to your questions about our ad platform and services.
          </p>
        </div>

        <Card className="mx-auto max-w-4xl border-border bg-card">
          {/* Chat Messages */}
          <div className="h-[500px] overflow-y-auto p-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      message.sender === "bot"
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {message.sender === "bot" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.sender === "bot"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="mt-1 text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t border-border p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </div>
        </Card>

        {/* Quick Questions */}
        <div className="mx-auto mt-8 max-w-4xl">
          <h2 className="mb-4 text-center text-lg font-semibold">Quick Questions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto whitespace-normal p-4 text-left bg-transparent"
              onClick={() => setInputValue("What ad formats do you support?")}
            >
              What ad formats do you support?
            </Button>
            <Button
              variant="outline"
              className="h-auto whitespace-normal p-4 text-left bg-transparent"
              onClick={() => setInputValue("How do I create an ad?")}
            >
              How do I create an ad?
            </Button>
            <Button
              variant="outline"
              className="h-auto whitespace-normal p-4 text-left bg-transparent"
              onClick={() => setInputValue("What sizes are available?")}
            >
              What sizes are available?
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
