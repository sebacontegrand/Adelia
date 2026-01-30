"use client"

import { useState, useRef } from "react"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageUploadProps {
    value?: string
    onChange: (url: string) => void
    onRemove: () => void
    disabled?: boolean
    className?: string
}

export function ImageUpload({ value, onChange, onRemove, disabled, className }: ImageUploadProps) {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast({
                title: "Invalid file type",
                description: "Please upload an image file.",
                variant: "destructive"
            })
            return
        }

        // 2MB limit
        if (file.size > 2 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Image must be less than 2MB.",
                variant: "destructive"
            })
            return
        }

        setIsLoading(true)
        try {
            const storage = getStorage()
            const storageRef = ref(storage, `logos/${Date.now()}-${file.name}`)
            const uploadTask = uploadBytesResumable(storageRef, file)

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    // Progress...
                },
                (error) => {
                    console.error("Upload error:", error)
                    toast({
                        title: "Upload failed",
                        description: "Something went wrong during upload.",
                        variant: "destructive"
                    })
                    setIsLoading(false)
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        onChange(downloadURL)
                        setIsLoading(false)
                        toast({ description: "Image uploaded successfully." })
                    })
                }
            )
        } catch (error) {
            console.error("Upload setup error:", error)
            setIsLoading(false)
        }
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className={`flex items-center gap-4 ${className}`}>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUpload}
                disabled={isLoading || disabled}
            />

            {value ? (
                <div className="relative h-20 w-20 rounded-md overflow-hidden border border-slate-200 group">
                    <img src={value} alt="Uploaded logo" className="h-full w-full object-cover" />
                    <button
                        onClick={onRemove}
                        type="button"
                        disabled={disabled}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={handleClick}
                    className="h-20 w-20 rounded-md border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors bg-slate-50"
                >
                    {isLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    ) : (
                        <Upload className="h-6 w-6 text-slate-400" />
                    )}
                </div>
            )}

            {!value && (
                <Button
                    type="button"
                    variant="secondary"
                    disabled={isLoading || disabled}
                    onClick={handleClick}
                    size="sm"
                >
                    {isLoading ? "Uploading..." : "Upload Logo"}
                </Button>
            )}
        </div>
    )
}
