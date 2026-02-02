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
        const dateId = getTodayDateId();
        const statsRef = doc(db, "ads", adId, "daily_stats", dateId);

        // 1. Daily Stats Update Data
        const dailyUpdate: any = {};
        // 2. Aggregate Stats Update Data (matching AdRecord type)
        const aggregateUpdate: any = {};

        if (event === "view" || event === "impression") {
            dailyUpdate.impressions = increment(1);
            dailyUpdate.views = increment(1);

            aggregateUpdate.totalImpressions = increment(1);
            aggregateUpdate.totalViews = increment(1);
        } else if (event === "click") {
            dailyUpdate.clicks = increment(1);

            aggregateUpdate.totalClicks = increment(1);
        } else {
            // custom event support
            dailyUpdate[`events.${event}`] = increment(1);
            aggregateUpdate[`events.${event}`] = increment(1);
        }

        // Update Daily Stats subcollection
        await setDoc(statsRef, dailyUpdate, { merge: true });

        // Update Aggregate Stats on the main ad document
        const adRef = doc(db, "ads", adId);
        await setDoc(adRef, aggregateUpdate, { merge: true });

    } catch (error) {
        console.error(`Failed to record stats for ${adId}:`, error);
    }
}
