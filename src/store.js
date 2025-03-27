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
  
  // Camera movement state
  isMovingCamera: false,
  targetCameraPosition: null,
  
  // Experience timing constants
  initialExperienceDelay: 1000, // ms
  moveSpeed: 0.1, // units per frame for camera movement
  
  // World configuration
  tileSize: 5,
  tileLocations: [],
  wallLocations: [],
  isMobile: false,
  
  // Experience content - enhanced with positions, colors, and better spacing
  experienceScript: {
    "prologue": {
      "text": "You open your eyes in the dark. You think you've been here before—but maybe it was only a dream."
    },
    "experiences": [
      {
        "experience": 1,
        "position": { x: 5, y: 0, z: 15 }, // Position for the player to stop at (z=15)
        "itemPosition": { x: 5, y: 0, z: 17 }, // Item 2 units ahead of player position
        "text": "The path ahead is unfolding, though it's a little hard to see where it goes. Trust that it will make sense eventually, but only if you stop trying to control it.",
        "item": {
          "name": "Candle",
          "text": "This candle holds a quiet flame. Sometimes, even the smallest light is enough.",
          "color": "yellow"
        }
      },
      {
        "experience": 2,
        "position": { x: 5, y: 0, z: 30 }, // Position for the player to stop, spaced further (z=30)
        "itemPosition": { x: 5, y: 0, z: 32 }, // Item 2 units ahead of player position
        "text": "The path ahead is unfolding, though it's a little hard to see where it goes. Trust that it will make sense eventually, but only if you stop trying to control it.",
        "item": {
          "name": "Toy Wooden Sword",
          "text": "A toy wooden sword. It's not much, but it may prove useful.",
          "color": "brown"
        }
      }
      // Other experiences can be added here...
    ]
  },
  
  // Dungeon layout
  dungeon: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  
  // Core action dispatchers
  setSceneLoaded: (value) => set({ sceneLoaded: value }),
  setLoadingFade: (value) => set({ loadingFade: value }),
  setPlayerPosition: (position) => set({ playerPosition: position }),
  setTileLocations: (tiles) => set({ tileLocations: tiles }),
  setWallLocations: (walls) => set({ wallLocations: walls }),
  setIsMobile: (value) => set({ isMobile: value }),
  
  // Inventory management
  addToInventory: (item) => {
    const state = get();
    // Only add if not already in inventory
    if (!state.inventory.some(invItem => invItem.name === item.name)) {
      // Create new inventory with the added item
      const updatedInventory = [...state.inventory, item];
      
      console.log(`Item "${item.name}" added to inventory`);
      console.log("Updated inventory:", updatedInventory.map(i => i.name).join(", "));
      
      set({ 
        inventory: updatedInventory,
        itemAnimationPhase: 'acquired'
      });
      
      // Show action overlay after a delay
      setTimeout(() => {
        if (state.currentExperienceIndex < state.experienceScript.experiences.length - 1) {
          console.log("Showing action overlay to move to next experience");
          set({
            showActionOverlay: true,
            actionType: 'move',
            actionDirection: 'forward'
          });
        } else {
          console.log("All experiences completed");
        }
      }, 1000);
    }
  },
  
  // Message overlay actions
  setShowMessageOverlay: (value) => set({ showMessageOverlay: value }),
  setMessageBoxVisible: (value) => set({ messageBoxVisible: value }),
  setCurrentMessage: (message) => set({ currentMessage: message }),
  setTypingInProgress: (value) => set({ typingInProgress: value }),
  
  // Action overlay controls
  setShowActionOverlay: (value, type = null, direction = null) => set({ 
    showActionOverlay: value,
    actionType: type,
    actionDirection: direction
  }),
  
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
  
  // Initialize the experience flow
  startExperience: () => {
    console.log("Starting experience flow - showing prologue");
    // Display prologue first
    set({
      showMessageOverlay: true,
      messageBoxVisible: true,
      currentExperienceIndex: -1,
      currentMessage: get().experienceScript.prologue.text,
      typingInProgress: true,
      showItemDisplay: true, // Show items from the start
      itemAnimationPhase: 'hidden'
    });
  },
  
  // Handle item click
  handleItemClick: () => {
    const state = get();
    const { currentExperienceIndex, experienceScript } = state;
    
    if (currentExperienceIndex >= 0 && state.itemAnimationPhase === 'clickable') {
      const experience = experienceScript.experiences[currentExperienceIndex];
      
      console.log(`Item "${experience.item.name}" clicked, showing item text`);
      set({
        showMessageOverlay: true,
        messageBoxVisible: true,
        currentMessage: experience.item.text,
        typingInProgress: true
      });
    }
  },
  
  // Progress to the next step in the experience
  progressExperience: () => {
    const state = get();
    const { currentExperienceIndex, experienceScript, itemAnimationPhase } = state;
    
    console.log(`Progressing experience from index ${currentExperienceIndex}, phase ${itemAnimationPhase}`);
    
    // Handle different stages of progression
    if (currentExperienceIndex === -1) {
      // Prologue finished, show the action overlay to move forward
      console.log("Prologue finished, showing action overlay");
      set({
        showMessageOverlay: false,
        messageBoxVisible: false,
        showActionOverlay: true,
        actionType: 'move',
        actionDirection: 'forward'
      });
    } else {
      // Within an experience, check what's displayed
      if (state.showMessageOverlay) {
        // Get the current experience
        const experience = experienceScript.experiences[currentExperienceIndex];
        
        if (state.currentMessage === experience.text) {
          // Main experience text was dismissed, make item clickable
          console.log(`Main text for experience ${currentExperienceIndex} dismissed, item now clickable`);
          set({
            showMessageOverlay: false,
            messageBoxVisible: false,
            showItemDisplay: true,
            currentItem: experience.item,
            itemAnimationPhase: 'clickable' // Make item clickable after dismissing experience text
          });
        } 
        else if (state.currentItem && state.currentMessage === state.currentItem.text) {
          // Item text dismissed, start item acquisition
          console.log(`Item text for "${state.currentItem.name}" dismissed, starting acquisition`);
          set({
            showMessageOverlay: false,
            messageBoxVisible: false,
            itemAnimationPhase: 'acquiring' // Start acquiring animation after dismissing item text
          });
        }
      }
    }
  },
  
  // Handle action overlay interactions
  handleAction: () => {
    const state = get();
    const { actionType, actionDirection, currentExperienceIndex } = state;
    
    console.log(`Handling action: ${actionType} ${actionDirection}`);
    
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
        
        console.log(`Moving to experience ${targetIndex} at position`, targetPosition);
        
        // Start camera movement
        state.startCameraMovement(targetPosition);
        
        // After reaching position, show experience text after delay
        setTimeout(() => {
          console.log(`Reached position for experience ${targetIndex}, showing text`);
          set({
            currentExperienceIndex: targetIndex,
            showMessageOverlay: true,
            messageBoxVisible: true,
            currentMessage: nextExperience.text,
            typingInProgress: true
          });
        }, state.initialExperienceDelay + (Math.abs(targetPosition.z - state.playerPosition.z) / state.moveSpeed) * 16); // Approximate time to reach destination
      }
    }
  }
}));

export default useGameStore;