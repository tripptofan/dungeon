import useGameStore from '../store';

/**
 * Message service utility to centralize message display logic
 * This reduces duplication and ensures consistent message behavior
 */
const MessageService = {
  /**
   * Show a message with typing animation
   * @param {string} message - The message to display
   * @param {Object} options - Additional options
   * @param {boolean} options.preserveItemVisibility - Whether to preserve item visibility
   * @param {boolean} options.forceSwordVisibility - Whether to force sword visibility
   */
  showMessage: (message, options = {}) => {
    const store = useGameStore.getState();
    const inventory = store.inventory;
    const currentExperienceIndex = store.currentExperienceIndex;
    const experiences = store.experienceScript.experiences;
    
    // Check if we have the sword in inventory
    const hasSword = inventory.some(item => item.name === "Toy Wooden Sword");
    
    // Check if current experience is sword related
    const isSwordExperience = currentExperienceIndex >= 0 && 
      currentExperienceIndex < experiences.length &&
      experiences[currentExperienceIndex].type === 'item' && 
      experiences[currentExperienceIndex].item?.name === "Toy Wooden Sword";
    
    // Special case for sword visibility
    const shouldForceSwordVisibility = options.forceSwordVisibility || 
                                       isSwordExperience || 
                                       hasSword;
    
    // Show the message
    store.setCurrentMessage(message);
    store.setShowMessageOverlay(true);
    store.setMessageBoxVisible(true);
    store.setTypingInProgress(true);
    
    // Handle item visibility
    if (shouldForceSwordVisibility) {
      store.setForceItemsVisible(true);
      store.setShowItemDisplay(true);
    } else if (options.preserveItemVisibility) {
      // Don't change item visibility settings
    } else {
      // Use default visibility behavior from the store
    }
  },
  
  /**
   * Hide the message overlay
   * @param {Object} options - Additional options
   * @param {boolean} options.preserveItemVisibility - Whether to preserve item visibility
   */
  hideMessage: (options = {}) => {
    const store = useGameStore.getState();
    
    // Always hide the message overlay
    store.setShowMessageOverlay(false);
    store.setMessageBoxVisible(false);
    
    // Handle item visibility preservation
    if (!options.preserveItemVisibility) {
      // Let the store handle default behavior
    }
  },
  
  /**
   * Show a message after a delay
   * @param {string} message - The message to display
   * @param {number} delay - Delay in milliseconds
   * @param {Object} options - Additional options
   */
  showMessageWithDelay: (message, delay = 500, options = {}) => {
    setTimeout(() => {
      MessageService.showMessage(message, options);
    }, delay);
  },
  showPrizeInteractionMessage: () => {
    const store = useGameStore.getState();
    
    store.setCurrentMessage("A mysterious artifact rests in your hands. Its secrets await...");
    store.setShowMessageOverlay(true);
    store.setMessageBoxVisible(true);
    store.setTypingInProgress(true);
  },
  
  /**
   * Show an enemy encounter message
   */
  showEnemyMessage: () => {
    MessageService.showMessage("Not all problems can be solved with words....", {
      forceSwordVisibility: true
    });
  },
  
  /**
   * Show a chest encounter message
   */
  showChestMessage: () => {
    MessageService.showMessage("A reward for the hero...", {
      preserveItemVisibility: true
    });
  }
};

export default MessageService;