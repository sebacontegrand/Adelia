const { ElevenLabsClient } = require("elevenlabs");
require("dotenv").config();

async function listVoices() {
    const client = new ElevenLabsClient({
        apiKey: process.env.ELEVENLABS_API_KEY,
    });

    try {
        const voices = await client.voices.getAll();
        console.log("Available Voices (Spanish Latin American Focus):");
        const spanishVoices = voices.voices.filter(v =>
            v.labels && (
                JSON.stringify(v.labels).toLowerCase().includes("spanish") ||
                JSON.stringify(v.labels).toLowerCase().includes("latin")
            )
        );

        spanishVoices.slice(0, 10).forEach(v => {
            console.log(`- ID: ${v.voice_id} | Name: ${v.name} | Category: ${v.category} | Labels: ${JSON.stringify(v.labels)}`);
        });

        console.log("\nSpecific search for Juan (onwK4e9ZLuTAKqD09mQs):");
        const juan = voices.voices.find(v => v.voice_id === "onwK4e9ZLuTAKqD09mQs");
        if (juan) {
            console.log("Juan found!", JSON.stringify(juan));
        } else {
            console.log("Juan NOT found in your available voices list.");
        }
    } catch (error) {
        console.error("Error fetching voices:", error);
    }
}

listVoices();
