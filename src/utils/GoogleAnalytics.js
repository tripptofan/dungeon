// src/utils/GoogleAnalytics.js

// No need for initialization anymore as it's in index.html
export const initializeGA = () => {
  // This is kept for backward compatibility but no longer needed
  // Will just verify that GA is available
  return verifyGAFunctionality();
};

// Track custom events with error handling
export const trackEvent = (event_name, category, additional_data = {}) => {
  try {
    if (window.gtag) {
      window.gtag('event', event_name, {
        'event_category': category,
        ...additional_data
      });
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

// Track calendar button clicks
export const trackCalendarButton = () => {
  // Track calendar button clicks
  window.gtag && window.gtag('event', 'button_click', {
    'event_category': 'interaction',
    'button_name': 'calendar',
    'transport_type': 'beacon', // Use beacon for reliability
    'non_interaction': false // Ensure it counts as an interaction
  });
  
  // Return true to allow default action to continue
  return true;
};

// Track download button clicks
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