export const TRACKING_SCRIPT = `
<script>
(function() {
  var AD_ID = "[[AD_ID]]";
  var TRACK_URL = "[[TRACK_URL]]";
  
  window.reportEvent = function(event) {
    if (!AD_ID || AD_ID === "[[AD_ID]]") return;
    
    // Beacon/Image approach (reliable for simple hits)
    var img = new Image();
    img.src = TRACK_URL + "?adId=" + AD_ID + "&event=" + event + "&t=" + Date.now();
    
    // Optional: Send POST for more data if needed (commented out for lightweight)
    /*
    fetch(TRACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId: AD_ID, event: event })
    }).catch(e => console.log("Track err", e));
    */
  };

  // Auto-report view
  window.reportEvent("view");

})();
</script>
`;
