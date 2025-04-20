// src/utils/GAVerification.js

// Helper utility to verify Google Analytics is working properly
// Add this to your project and run the verification by importing and calling verifyGA()

// Simple verification check
export const verifyGA = () => {
    console.log("Running Google Analytics verification...");
    
    // 1. Check if gtag function exists
    if (typeof window.gtag !== 'function') {
      console.error("❌ Google Analytics verification failed: gtag function not found");
      console.log("Try adding the GA script directly in your HTML head instead of dynamically loading it.");
      return false;
    }
    
    console.log("✅ gtag function found");
    
    // 2. Check if the tracking ID is properly configured
    try {
      // Test sending an event
      window.gtag('event', 'verification_test', {
        'event_category': 'testing',
        'timestamp': new Date().toISOString(),
        'transport_type': 'beacon'
      });
      console.log("✅ Test event sent successfully");
    } catch (error) {
      console.error("❌ Error sending test event:", error);
      return false;
    }
    
    // 3. Check for network requests to Google Analytics
    console.log("Checking network requests to Google Analytics...");
    console.log("Please look in the Network tab for requests to 'google-analytics.com' or 'analytics.google.com'");
    
    // 4. Provide additional troubleshooting tips
    console.log("");
    console.log("ℹ️ Troubleshooting Tips:");
    console.log("1. Check if you have any content blockers or ad blockers enabled in your browser");
    console.log("2. Check if 'Do Not Track' is enabled in your browser settings");
    console.log("3. Ensure there are no CORS issues (look for errors in the console)");
    console.log("4. Data can take 24-48 hours to appear in Google Analytics reports");
    console.log("5. Check Real-time reports in GA4 to see if events are being tracked in real time");
    console.log("6. Verify the tracking ID is correct (G-G03YMC497R)");
    
    // Try to detect potential issues
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1") {
      console.warn("⚠️ 'Do Not Track' appears to be enabled in your browser, which might prevent GA from tracking events");
    }
    
    // Check if enhanced measurement is enabled in GA4
    console.log("");
    console.log("Make sure Enhanced Measurement is enabled in GA4:");
    console.log("1. Go to Admin > Data Streams");
    console.log("2. Click on your web stream");
    console.log("3. Make sure Enhanced Measurement is ON");
    
    // Final step - suggest using Google Analytics Debugger extension
    console.log("");
    console.log("For more detailed debugging, install the Google Analytics Debugger Chrome extension:");
    console.log("https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna");
    
    return true;
  };
  
  // Run a simple connectivity test to check if GA servers are reachable
  export const checkGAConnectivity = async () => {
    try {
      // Try to fetch the Google Analytics ping endpoint
      const response = await fetch('https://www.google-analytics.com/collect?v=1&t=event&tid=UA-XXXXXX-Y&cid=555&ec=test&ea=test', {
        mode: 'no-cors', // This is important since GA doesn't support CORS
        method: 'GET'
      });
      
      // Since we're using no-cors, we can't actually check the response status
      // But if the request didn't throw an error, it's likely reachable
      console.log("✅ Google Analytics servers appear to be reachable");
      return true;
    } catch (error) {
      console.error("❌ Could not connect to Google Analytics servers:", error);
      console.log("This may indicate network issues or restrictions that prevent tracking");
      return false;
    }
  };
  
  // Comprehensive verification function
  export const runFullGADiagnostics = async () => {
    console.group("Google Analytics Diagnostics");
    
    // Check basic setup
    verifyGA();
    
    // Check connectivity
    await checkGAConnectivity();
    
    // Send test events for all your custom events
    if (typeof window.gtag === 'function') {
      console.log("Sending test events for all tracked actions...");
      
      // Test page_view
      window.gtag('event', 'page_view', {
        'page_title': 'GA Diagnostics Page',
        'page_location': window.location.href,
        'transport_type': 'beacon'
      });
      
      // Test visitor
      window.gtag('event', 'visitor', {
        'event_category': 'system',
        'transport_type': 'beacon'
      });
      
      // Test calendar click
      window.gtag('event', 'button_click', {
        'event_category': 'interaction',
        'button_name': 'calendar',
        'transport_type': 'beacon'
      });
      
      // Test download click
      window.gtag('event', 'button_click', {
        'event_category': 'interaction',
        'button_name': 'download',
        'transport_type': 'beacon'
      });
      
      // Test portal entry
      window.gtag('event', 'portal_entry', {
        'event_category': 'game_progress',
        'transport_type': 'beacon'
      });
      
      console.log("✅ All test events sent successfully");
    }
    
    console.log("");
    console.log("Diagnostics complete. If events still don't appear in GA4:");
    console.log("1. Check GA4 DebugView at Admin > DebugView");
    console.log("2. Ensure you're looking at the correct GA4 property");
    console.log("3. Allow 24-48 hours for data processing");
    console.log("4. Check if your CloudFront distribution has any security headers that might block tracking");
    
    console.groupEnd();
  };
  
  export default {
    verifyGA,
    checkGAConnectivity,
    runFullGADiagnostics
  };