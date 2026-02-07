import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";

const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { lines } = await req.json();

        if (!lines || !Array.isArray(lines)) {
            return NextResponse.json({ error: "Invalid lines" }, { status: 400 });
        }

        // Map our lines to the format ElevenLabs expects: { inputs: [{ text, voice_id }, ...] }
        const inputs = lines.map((line: any) => ({
            text: line.text,
            voice_id: line.voiceId, // Correctly mapping camelCase from client to snake_case for API
        }));

        const response = await fetch("https://api.elevenlabs.io/v1/text-to-dialogue", {
            method: "POST",
            headers: {
                "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs,
                model_id: "eleven_v3",
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Log ElevenLabs error details for debugging as requested
            console.error("ElevenLabs API Error:", errorData);
            return NextResponse.json({
                error: errorData.detail?.message || errorData.detail || "ElevenLabs API error"
            }, { status: response.status });
        }

        const audioBuffer = await response.arrayBuffer();

        return new NextResponse(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
            },
        });

    } catch (error: any) {
        console.error("ElevenLabs Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
