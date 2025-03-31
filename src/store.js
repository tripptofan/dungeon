import { create } from 'zustand';

// Create a store with optimized structure and enhanced experience flow
const useGameStore = create((set, get) => ({
  // Scene loading state
  sceneLoaded: false,
  loadingFade: false,
  
  // Player state
  playerPosition: { x: 0, y: 2, z: 0 },
  playerHealth: 100,
  inventory: [], // Player's inventory
  
  // Message overlay state
  showMessageOverlay: false,
  messageBoxVisible: false,
  currentMessage: "",
  typingInProgress: false,
  currentExperienceIndex: -1, // Start with prologue (-1)
  
  // Action overlay state
  showActionOverlay: false,
  actionType: null, // 'move', 'interact', etc
  actionDirection: null, // 'forward', 'left', 'right'
  
  // Item display state
  showItemDisplay: false,
  currentItem: null,
  itemAnimationPhase: 'hidden', // 'hidden', 'clickable', 'acquiring', 'acquired'
  forceItemsVisible: false, // Force items to be visible regardless of other state
  
  // Sword swing animation state
  swordSwinging: false,
  swingDirection: { x: 0, y: 0 }, // Direction of the swing
  swingProgress: 0, // Animation progress (0 to 1)
  swingSpeed: 2.0, // Speed multiplier for swing animation
  
  // Viewport dimensions for responsive positioning
  viewportSize: {
    width: window.innerWidth,
    height: window.innerHeight,
    aspectRatio: window.innerWidth / window.innerHeight
  },
  
  // Camera movement state
  isMovingCamera: false,
  targetCameraPosition: null,
  
  // Camera shake state
  cameraShaking: {
    isShaking: false,
    intensity: 0.5,
    decay: 0.92,
    maxOffset: 0.3,
    duration: 3000, // Default 3 seconds
    onComplete: null
  },
  
  // Experience timing constants
  initialExperienceDelay: 100, // ms - reduced to make events feel more immediate
  moveSpeed: 0.03, // units per frame for camera movement - consistent pace
  
  // World configuration
  tileSize: 5,
  tileLocations: [],
  wallLocations: [],
  isMobile: false,
  
  // Experience content - simplified flow with just item interactions and shaking events
  experienceScript: {
    "prologue": {
      "text": "You open your eyes in the dark. You think you've been here before—but maybe it was only a dream."
    },
    "experiences": [
      {
        "experience": 1,
        "position": { x: 5, y: 0, z: 15 }, // Position for the player to stop at (z=15)
        "itemPosition": { x: 5, y: 0, z: 17 }, // Item 2 units ahead of player position
        "type": "item",
        "item": {
          "name": "Lantern", 
          "text": "An old lantern with a flickering flame. Its warm glow will help guide your way through the darkness.",
          "color": "yellow"
        }
      },
      {
        "experience": 2,
        "position": { x: 5, y: 0, z: 30 }, // Position for the player to stop, spaced further (z=30)
        "itemPosition": { x: 5, y: 0, z: 32 }, // Item 2 units ahead of player position
        "type": "item",
        "item": {
          "name": "Toy Wooden Sword",
          "text": "A toy wooden sword. It's not much, but it may prove useful.",
          "color": "brown"
        }
      },
      {
        "experience": 3,
        "position": { x: 5, y: 0, z: 55 }, // First shake event position
        "type": "shake",
        "shakeConfig": {
          "intensity": 0.5, // Reduced from 0.8 to 0.5
          "duration": 3000,
          "message": "What was that?"
        }
      },
      {
        "experience": 4,
        "position": { x: 5, y: 0, z: 65 }, // Second shake event position
        "type": "shake",
        "shakeConfig": {
          "intensity": 0.7, // Reduced from 1.0 to 0.7
          "duration": 3000,
          "message": "Something is coming..."
        }
      }
    ]
  },
  
  // Dungeon layout - expanded for longer corridor
  dungeon: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  
  // Core action dispatchers
  setSceneLoaded: (value) => set({ sceneLoaded: value }),
  setLoadingFade: (value) => set({ loadingFade: value }),
  setPlayerPosition: (position) => set({ playerPosition: position }),
  setTileLocations: (tiles) => set({ tileLocations: tiles }),
  setWallLocations: (walls) => set({ wallLocations: walls }),
  setIsMobile: (value) => set({ isMobile: value }),
  
  // Viewport size management
  updateViewportSize: (dimensions) => set({ viewportSize: dimensions }),
  
  // Force items visibility control
  setForceItemsVisible: (value) => set({ forceItemsVisible: value }),
  
  // Inventory management
  addToInventory: (item) => {
    const state = get();
    // Only add if not already in inventory
    if (!state.inventory.some(invItem => invItem.name === item.name)) {
      // Create new inventory with the added item
      const updatedInventory = [...state.inventory, item];
      
      set({ 
        inventory: updatedInventory,
        itemAnimationPhase: 'acquired',
        // Always ensure item display is enabled when item is acquired
        showItemDisplay: true,
        // Force items to be visible when acquired
        forceItemsVisible: true
      });
      
      // Show action overlay after a delay
      setTimeout(() => {
        if (state.currentExperienceIndex < state.experienceScript.experiences.length - 1) {
          set({
            showActionOverlay: true,
            actionType: 'move',
            actionDirection: 'forward',
            // Make sure items stay visible during action overlay
            showItemDisplay: true,
            forceItemsVisible: true
          });
        }
      }, 1000);
    }
  },
  
  // Message overlay actions
  setShowMessageOverlay: (value) => {
    // When showing message overlay, ensure items remain visible if they're already visible
    const currentShowItemDisplay = get().showItemDisplay;
    const currentForceItemsVisible = get().forceItemsVisible;
    const currentExperienceIndex = get().currentExperienceIndex;
    const experiences = get().experienceScript.experiences;
    
    // FIX: Check if we're in the sword experience
    const isSwordExperience = currentExperienceIndex >= 0 && 
      currentExperienceIndex < experiences.length &&
      experiences[currentExperienceIndex].type === 'item' && 
      experiences[currentExperienceIndex].item?.name === "Toy Wooden Sword";
    
    // Keep sword visible regardless of other state
    if (isSwordExperience) {
      set({ 
        showMessageOverlay: value,
        showItemDisplay: true,
        forceItemsVisible: true
      });
    } else {
      set({ 
        showMessageOverlay: value,
        // Keep item display on if it was already on
        showItemDisplay: value ? currentShowItemDisplay : get().showItemDisplay,
        // Preserve force items visible setting
        forceItemsVisible: currentForceItemsVisible
      });
    }
  },
  
  setMessageBoxVisible: (value) => set({ messageBoxVisible: value }),
  setCurrentMessage: (message) => set({ currentMessage: message }),
  setTypingInProgress: (value) => set({ typingInProgress: value }),
  
  // Action overlay controls
  setShowActionOverlay: (value, type = null, direction = null) => {
    // Preserve item visibility when showing action overlay
    const currentShowItemDisplay = get().showItemDisplay;
    const currentForceItemsVisible = get().forceItemsVisible;
    const hasItems = get().inventory.length > 0;
    
    set({ 
      showActionOverlay: value,
      actionType: type,
      actionDirection: direction,
      // Keep item display on if we have items
      showItemDisplay: hasItems ? true : currentShowItemDisplay,
      // Preserve force items visible setting
      forceItemsVisible: currentForceItemsVisible
    });
  },
  
  // Item display controls
  setShowItemDisplay: (value) => set({ showItemDisplay: value }),
  setCurrentItem: (item) => set({ currentItem: item }),
  setItemAnimationPhase: (phase) => set({ itemAnimationPhase: phase }),
  
  // Camera movement controls
  startCameraMovement: (targetPosition) => set({ 
    isMovingCamera: true,
    targetCameraPosition: targetPosition
  }),
  
  stopCameraMovement: () => set({ isMovingCamera: false }),
  
  // Camera shake controls - FIXED VERSION
  startCameraShake: (config, onComplete) => {
    // Ensure we have a valid config object
    const configObj = typeof config === 'object' ? config : {};
    
    const defaultConfig = {
      isShaking: true,
      intensity: 0.5,
      decay: 0.92,
      maxOffset: 0.3,
      duration: 3000
    };
    
    const fullConfig = { 
      ...defaultConfig, 
      ...configObj, 
      isShaking: true, 
      onComplete: typeof onComplete === 'function' ? onComplete : null 
    };
    
    // Double check we're actually setting isShaking to true
    const newCameraShaking = {
      ...fullConfig,
      isShaking: true // Explicitly ensure this is true
    };
    
    set({ cameraShaking: newCameraShaking });
  },
  
  stopCameraShake: () => {
    const currentShakeConfig = get().cameraShaking;
    const onComplete = currentShakeConfig.onComplete;
    
    // Update the shake state
    set({ 
      cameraShaking: { ...currentShakeConfig, isShaking: false } 
    });
    
    // Call the onComplete callback if provided
    if (typeof onComplete === 'function') {
      onComplete();
    }
  },
  
  // Initialize the experience flow
  startExperience: () => {
    // Display prologue first
    set({
      showMessageOverlay: true,
      messageBoxVisible: true,
      currentExperienceIndex: -1,
      currentMessage: get().experienceScript.prologue.text,
      typingInProgress: true,
      showItemDisplay: true, // Always show items from the start
      itemAnimationPhase: 'hidden'
    });
  },
  
  // Handle item click
  handleItemClick: () => {
    const state = get();
    const { currentExperienceIndex, experienceScript } = state;
    
    if (currentExperienceIndex >= 0 && state.itemAnimationPhase === 'clickable') {
      const experience = experienceScript.experiences[currentExperienceIndex];
      
      if (experience.type === 'item') {
        set({
          showMessageOverlay: false,
          messageBoxVisible: false,
          showItemDisplay: true, // Ensure item display stays enabled during acquisition
          itemAnimationPhase: 'acquiring' // Start acquiring animation immediately
        });
      }
    }
  },
  
  // Progress to the next step in the experience - FIXED VERSION
  progressExperience: () => {
    const state = get();
    const { currentExperienceIndex, experienceScript, inventory, forceItemsVisible } = state;
    
    // Always preserve item visibility if we have items
    const hasAcquiredItems = inventory.length > 0;
    
    // Check if we have the sword in inventory for special handling
    const hasSword = inventory.some(item => item.name === "Toy Wooden Sword");
    
    // FIX: Check if current experience is sword related
    const isSwordExperience = currentExperienceIndex >= 0 && 
      currentExperienceIndex < experienceScript.experiences.length &&
      experienceScript.experiences[currentExperienceIndex].type === 'item' && 
      experienceScript.experiences[currentExperienceIndex].item?.name === "Toy Wooden Sword";
    
    // If we're in the sword experience, always force visibility on
    if (isSwordExperience) {
      set({
        showItemDisplay: true,
        forceItemsVisible: true
      });
    }
    
    // Handle different stages of progression
    if (currentExperienceIndex === -1) {
      // Prologue finished, show the action overlay to move forward
      set({
        showMessageOverlay: false,
        messageBoxVisible: false,
        showActionOverlay: true,
        actionType: 'move',
        actionDirection: 'forward',
        // Keep items visible if we have any
        showItemDisplay: hasAcquiredItems ? true : state.showItemDisplay,
        // Preserve force flag if it was set
        forceItemsVisible: forceItemsVisible || hasSword || isSwordExperience
      });
    } else {
      // Within an experience, check what's displayed
      if (state.showMessageOverlay) {
        // Get the current experience
        const experience = experienceScript.experiences[currentExperienceIndex];
        
        // Special case for Toy Wooden Sword
        const isSwordExperience = experience.type === 'item' && 
                                 experience.item.name === "Toy Wooden Sword";
        
        if (experience.type === 'shake' && state.currentMessage === experience.shakeConfig.message) {
          // After shake message is dismissed, show move forward action
          set({
            showMessageOverlay: false,
            messageBoxVisible: false,
            showActionOverlay: true,
            actionType: 'move',
            actionDirection: 'forward',
            // Keep items visible if we have any
            showItemDisplay: hasAcquiredItems ? true : state.showItemDisplay,
            // Preserve force flag if it was set or we have the sword
            forceItemsVisible: forceItemsVisible || hasSword || isSwordExperience
          });
        } 
        else if (experience.type === 'item' && state.currentMessage === experience.item.text) {
          // Item text dismissed, make item clickable
          set({
            showMessageOverlay: false,
            messageBoxVisible: false,
            showItemDisplay: true, // Always keep this true for items
            itemAnimationPhase: 'clickable',
            // Very important: Ensure force visibility remains on for sword or if we have items
            forceItemsVisible: forceItemsVisible || isSwordExperience || hasSword || hasAcquiredItems
          });
        }
      }
    }
  },
  
  // Handle action overlay interactions - FIXED VERSION
  handleAction: () => {
    const state = get();
    const { actionType, actionDirection, currentExperienceIndex, forceItemsVisible } = state;
    
    if (actionType === 'move' && actionDirection === 'forward') {
      // Hide the action overlay
      set({ showActionOverlay: false });
      
      // Determine target position
      let targetIndex = currentExperienceIndex + 1;
      if (targetIndex >= 0 && targetIndex < state.experienceScript.experiences.length) {
        const nextExperience = state.experienceScript.experiences[targetIndex];
        const targetPosition = {
          x: nextExperience.position.x,
          y: state.playerPosition.y, // Keep current height
          z: nextExperience.position.z
        };
        
        // FIX: Special case for moving to sword experience - improved detection
        const isSwordExperience = nextExperience.type === 'item' && 
                                 nextExperience.item?.name === "Toy Wooden Sword";
        
        // Check if we have any items in inventory
        const hasItems = state.inventory.length > 0;
        const hasSword = state.inventory.some(item => item.name === "Toy Wooden Sword");
        
        // Keep item display enabled if moving to another item experience
        const keepItemDisplay = nextExperience.type === 'item' || hasItems;
        
        // For sword experience, always keep things visible
        if (isSwordExperience) {
          set({ 
            currentExperienceIndex: targetIndex,
            showItemDisplay: true,
            forceItemsVisible: true
          });
        } else {
          // We'll handle the experience triggering in the Player component's update
          // Set the current experience index, but don't trigger the events yet
          set({ 
            currentExperienceIndex: targetIndex,
            // Important: Don't turn off showItemDisplay when moving to another item experience
            showItemDisplay: keepItemDisplay,
            // Preserve force items visible, but force it on for sword experience or if we have the sword
            forceItemsVisible: forceItemsVisible || hasSword
          });
        }
        
        // Start camera movement
        state.startCameraMovement(targetPosition);
      }
    }
  },
  
  // Sword swing animation controls
  startSwordSwing: (direction) => {
    const state = get();
    
    // Only allow swinging if:
    // 1. We have a sword in inventory
    // 2. No message or action overlay is currently visible
    // 3. Not currently swinging
    const hasSword = state.inventory.some(item => item.name === "Toy Wooden Sword");
    const noOverlays = !state.showMessageOverlay && !state.showActionOverlay;
    
    if (hasSword && noOverlays && !state.swordSwinging) {
      // Normalize the direction vector
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      const normalizedDirection = {
        x: direction.x / length,
        y: direction.y / length
      };
      
      set({
        swordSwinging: true,
        swingDirection: normalizedDirection,
        swingProgress: 0
      });
      
      // Auto-complete the swing animation after a delay
      setTimeout(() => {
        get().completeSwordSwing();
      }, 700); // Animation duration in ms
    }
  },
  
  // Update the sword swing animation progress (called in animation loop)
  updateSwordSwing: (delta) => {
    const state = get();
    
    if (state.swordSwinging) {
      // Adjusted swing progression speed for a more dramatic effect
      // This makes the initial part of the swing faster and the follow-through slower
      let speedMultiplier = 3.0;
      
      // Slow down in the second half of the animation for better follow-through
      if (state.swingProgress > 0.5) {
        speedMultiplier = 1.5;
      }
      
      const newProgress = state.swingProgress + (delta * state.swingSpeed * speedMultiplier);
      
      if (newProgress >= 1) {
        // Animation complete
        get().completeSwordSwing();
      } else {
        set({ swingProgress: newProgress });
      }
    }
  },
  
  // Complete the sword swing animation
  completeSwordSwing: () => {
    set({
      swordSwinging: false,
      swingProgress: 0
    });
  }
}));

export default useGameStore;