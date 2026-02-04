"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUserProfile, type UserProfile } from "@/firebase/firestore"

interface SlotSelectorProps {
    value: string
    onChange: (value: string, price?: number) => void
    onAvailableSlotsLoad?: (slots: UserProfile["availableSlots"]) => void
}

export function SlotSelector({ value, onChange, onAvailableSlotsLoad }: SlotSelectorProps) {
    const { data: session } = useSession()
    const [availableSlots, setAvailableSlots] = useState<UserProfile["availableSlots"]>([])

    useEffect(() => {
        if (session?.user?.email) {
            getUserProfile(session.user.email).then(profile => {
                if (profile?.availableSlots) {
                    setAvailableSlots(profile.availableSlots)
                    if (onAvailableSlotsLoad) {
                        onAvailableSlotsLoad(profile.availableSlots)
                    }
                }
            })
        }
    }, [session, onAvailableSlotsLoad])

    const handleValueChange = (val: string) => {
        const slot = availableSlots.find(s => s.id === val)
        onChange(val, slot?.price)
    }

    return (
        <div className="space-y-2">
            <Label>Target Slot (Media Kit)</Label>
            <Select value={value} onValueChange={handleValueChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a slot..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="manual">-- Manual / Custom --</SelectItem>
                    {availableSlots.map(slot => (
                        <SelectItem key={slot.id} value={slot.id}>
                            {slot.name} ({slot.format})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
                Linked to your Media Kit settings. Selecting a slot will automatically set the CPM.
            </p>
        </div>
    )
}
