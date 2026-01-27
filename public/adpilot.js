/**
 * AdPress Universal Tag (AdPilot)
 * 
 * Usage:
 * <script src="https://[YOUR_DOMAIN]/adpilot.js?id=[USER_ID]" async></script>
 */

(function () {
    console.log("AdPilot: Initializing...");

    // 1. Get User ID from Script Tag
    const scriptTag = document.currentScript || document.querySelector('script[src*="adpilot.js"]');
    const urlParams = new URLSearchParams(scriptTag.src.split('?')[1]);
    const userId = urlParams.get('id');

    if (!userId) {
        console.error("AdPilot: Missing 'id' parameter in script tag.");
        return;
    }

    // 2. Fetch Ad Configuration
    async function loadAds() {
        try {
            const response = await fetch(`/api/serve?userId=${userId}`);
            if (!response.ok) throw new Error("Failed to fetch ad config");
            const config = await response.json();

            console.log("AdPilot: Config loaded", config);
            renderAds(config.placements);
        } catch (e) {
            console.error("AdPilot: Error loading ads", e);
        }
    }

    // 3. Render Ads
    function renderAds(placements) {
        if (!placements) return;

        placements.forEach(placement => {
            const container = document.querySelector(placement.selector);
            if (container) {
                console.log(`AdPilot: Injecting ad into ${placement.selector}`);

                // Clear container
                container.innerHTML = '';

                if (placement.type === 'native') {
                    // Inject Native HTML directly (inherits page styles)
                    const wrapper = document.createElement('div');
                    wrapper.innerHTML = placement.html;
                    container.appendChild(wrapper);
                } else {
                    // Standard Iframe for Banner Ads
                    const iframe = document.createElement('iframe');
                    iframe.srcdoc = placement.html;
                    iframe.style.width = '100%';
                    iframe.style.height = placement.height ? `${placement.height}px` : '250px';
                    iframe.style.border = 'none';
                    iframe.style.overflow = 'hidden';
                    container.appendChild(iframe);
                }

            } else {
                console.warn(`AdPilot: Container ${placement.selector} not found.`);
            }
        });
    }

    // Run
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAds);
    } else {
        loadAds();
    }

})();
