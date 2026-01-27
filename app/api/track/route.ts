import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/firebase.config";
import { doc, setDoc, increment, collection } from "firebase/firestore";

// Helper to get today's date string YYYY-MM-DD
const getTodayDateId = () => {
    return new Date().toISOString().split("T")[0];
};

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const adId = searchParams.get("adId");
    const event = searchParams.get("event") || "view"; // default to view

    if (adId) {
        await recordEvent(adId, event);
    }

    // Return a 1x1 transparent GIF
    const pixel = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
    );

    return new NextResponse(pixel, {
        headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { adId, event } = body;

        if (!adId || !event) {
            return NextResponse.json({ error: "Missing adId or event" }, { status: 400 });
        }

        await recordEvent(adId, event);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Track error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

async function recordEvent(adId: string, event: string) {
    try {
        // We act as admin logic here or just regular write if rules allow. 
        // For simplicity in this project context, we are using the client SDK imported in server context.
        // Ideally use firebase-admin for server-side operations to bypass client rules if needed, 
        // but if rules allow public write for stats increment, client SDK is fine.

        const dateId = getTodayDateId();
        const statsRef = doc(db, "ads", adId, "daily_stats", dateId);

        // Map event to field
        const updateData: any = {};

        if (event === "view" || event === "impression") {
            updateData.views = increment(1);
            updateData.impressions = increment(1); // keeping both for compatibility
        } else if (event === "click") {
            updateData.clicks = increment(1);
        } else {
            // custom event support
            updateData[`events.${event}`] = increment(1);
        }

        // Use setDoc with merge: true to create if not exists
        await setDoc(statsRef, updateData, { merge: true });

    } catch (error) {
        console.error(`Failed to record stats for ${adId}:`, error);
    }
}
