export const TRACKING_SCRIPT = `
<script>
(function() {
  var clickMacro = "%%CLICK_URL_UNESC%%";
  var AD_ID = "[[AD_ID]]";
  var TRACK_URL = "[[TRACK_URL]]";
  
  window.reportEvent = function(event) {
    if (!AD_ID || AD_ID === "[[AD_ID]]") return;
    
    // Beacon/Image approach (reliable for simple hits)
    var img = new Image();
    img.src = TRACK_URL + "?adId=" + AD_ID + "&event=" + event + "&t=" + Date.now();
  };

  // Auto-report view
  window.reportEvent("view");

})();
</script>
`;
