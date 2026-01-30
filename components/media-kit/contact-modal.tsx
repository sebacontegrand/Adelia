"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail } from "lucide-react"

interface ContactModalProps {
    contactEmail: string
    trigger?: React.ReactNode
    subjectPrefix?: string
}

export function ContactModal({ contactEmail, trigger, subjectPrefix = "Inquiry:" }: ContactModalProps) {
    const [name, setName] = useState("")
    const [company, setCompany] = useState("")
    const [message, setMessage] = useState("")
    const [isOpen, setIsOpen] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const subject = `${subjectPrefix} ${company ? `from ${company}` : ""}`
        const body = `Hi,\n\nMy name is ${name}${company ? ` from ${company}` : ""}.\n\n${message}\n\nBest regards,\n${name}`

        window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        setIsOpen(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                        <Mail className="h-4 w-4" />
                        Contact for Sponsorships
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Contact Advertiser</DialogTitle>
                    <DialogDescription>
                        Send an inquiry directly to the publisher.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="company">Company / Brand</Label>
                        <Input id="company" value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} placeholder="I'm interested in..." required />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Prepare Email</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
