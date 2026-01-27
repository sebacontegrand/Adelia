
import { type NextRequest, NextResponse } from "next/server";
import { getUserAds, type AdRecord } from "@/firebase/firestore";

// This endpoint is called by adpilot.js
// GET /api/serve?userId=...
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    try {
        // 1. Fetch all ads for this user
        const ads = await getUserAds(userId);

        // 2. Filter for ads that have a "selector" defined in their settings (i.e., they are mapped to a DOM ID)
        // For now, we will Mock this mapping or check if 'placement' is used as selector #placement
        // In a real app, users would explicitly map "Ad Unit A" -> "HTML ID #header"

        const placements = ads
            .filter(ad => ad.placement || (ad.settings && ad.settings.targetElementId))
            .map(ad => {
                // Determine DOM Selector
                // If it's a Slot ID (from Media Kit), we assume the user has a <div id="slot-id"></div>
                // Fallback to legacy settings.targetElementId
                const selectorId = ad.placement || ad.settings.targetElementId;
                const selector = selectorId.startsWith("#") ? selectorId : `#${selectorId}`;

                let html = "";
                let type = "iframe";

                if (ad.type === "native-display") {
                    type = "native";
                    // Generate Native HTML
                    const s = ad.settings;
                    html = `
                    <div style="font-family: inherit; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff; color: inherit; display: flex; flex-direction: column; max-width: 100%;">
                        ${s.imageUrl ? `<img src="${s.imageUrl}" alt="${s.headline}" style="width: 100%; height: auto; object-fit: cover; aspect-ratio: 1200/628;">` : ""}
                        <div style="padding: 16px;">
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px;">Sponsored</div>
                            <h3 style="margin: 0 0 8px 0; font-size: 1.125rem; font-weight: 700; line-height: 1.4;">${s.headline}</h3>
                            <p style="margin: 0 0 16px 0; font-size: 0.875rem; color: #475569; line-height: 1.5;">${s.body}</p>
                            <a href="${s.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #fff; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 0.875rem; font-weight: 500;">
                                ${s.ctaText}
                            </a>
                        </div>
                    </div>
                    `;
                } else {
                    // Standard Iframe Ad
                    html = `<iframe src="${ad.htmlUrl}" width="${ad.settings?.width || '100%'}" height="${ad.settings?.height || '250'}" frameborder="0" scrolling="no" style="width: 100%; height: 100%; overflow: hidden;"></iframe>`;
                }

                return {
                    selector,
                    html,
                    type,
                    height: ad.settings?.height
                };
            });

        return NextResponse.json({
            placements
        });

    } catch (error) {
        console.error("Error serving ads:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
