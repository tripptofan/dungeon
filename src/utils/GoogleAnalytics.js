// src/utils/GoogleAnalytics.js

// Initialize Google Analytics with error handling
export const initializeGA = () => {
  try {
    // Add the Google tag script dynamically
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = "https://www.googletagmanager.com/gtag/js?id=G-G03YMC497R";
    document.head.appendChild(script1);

    // Add the configuration script
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag; // Make gtag available globally

    // Initialize the tag with the correct configuration
    gtag('js', new Date());
    
    // Add config
    gtag('config', 'G-G03YMC497R', {
      'send_page_view': true,
      'transport_type': 'beacon' // More reliable especially on page unload
    });
    
    // Track the page view as a unique visitor
    trackEvent('page_view', 'visitor');
    
  } catch (error) {
    // Silent fail in production
  }
};

// Track custom events with error handling
export const trackEvent = (event_name, category, additional_data = {}) => {
  try {
    if (window.gtag) {
      // Use setTimeout to ensure event is sent asynchronously
      setTimeout(() => {
        window.gtag('event', event_name, {
          'event_category': category,
          ...additional_data
        });
      }, 0);
      
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

// Export specific event tracking functions
export const trackCalendarButton = () => {
  // Force synchronous execution to ensure tracking before page navigation
  window.gtag && window.gtag('event', 'button_click', {
    'event_category': 'interaction',
    'button_name': 'calendar',
    'transport_type': 'beacon', // Use beacon for reliability
    'non_interaction': false // Ensure it counts as an interaction
  });
  
  // Return true to allow default action to continue
  return true;
};

export const trackDownloadButton = () => {
  // Force synchronous execution to ensure tracking before page navigation
  window.gtag && window.gtag('event', 'button_click', {
    'event_category': 'interaction',
    'button_name': 'download',
    'transport_type': 'beacon', // Use beacon for reliability
    'non_interaction': false // Ensure it counts as an interaction
  });
  
  // Return true to allow default action to continue
  return true;
};

export const trackPortalEntry = () => {
  // Force synchronous execution to ensure tracking before page navigation
  window.gtag && window.gtag('event', 'portal_entry', {
    'event_category': 'game_progress',
    'transport_type': 'beacon', // Use beacon for reliability
    'non_interaction': false // Ensure it counts as an interaction
  });
  
  // Return true to allow default action to continue
  return true;
};

// Helper function to check if GA is working properly
export const verifyGAFunctionality = () => {
  return !!window.gtag;
};

export default {
  initializeGA,
  trackEvent,
  trackCalendarButton,
  trackDownloadButton,
  trackPortalEntry,
  verifyGAFunctionality
};