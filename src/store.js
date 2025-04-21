import { create } from 'zustand';

// Create a store with optimized structure and enhanced experience flow
const useGameStore = create((set, get) => ({
  // Scene loading state
  sceneLoaded: false,
  loadingFade: false,
  
  // Player state
  playerPosition: { x: 0, y: 2, z: 0 },
  playerHealth: 100,
  inventory: [],
  
  // Door interaction state
  doorClickable: false,
  isDoorClicked: false,
  movingToDoor: false,
  doorPosition: { x: 0, y: 0, z: 0 },
  fadingToBlack: false,
  blackScreenOpacity: 0,
  portalEntered: false,
  
  // Render order constants
  renderOrder: {
    DEFAULT: 0,
    EYES: 2000,
    TREASURE_CHEST: 5000,
    ENEMY: 7000,
    MESSAGE_OVERLAY: 15000,
    ACQUIRED_ITEMS: 30000
  },
  
  // Message overlay state
  showMessageOverlay: false,
  messageBoxVisible: false,
  currentMessage: "",
  typingInProgress: false,
  currentExperienceIndex: -1,
  
  // Action overlay state
  showActionOverlay: false,
  actionType: null,
  actionDirection: null,
  
  // Item display state
  showItemDisplay: false,
  currentItem: null,
  itemAnimationPhase: 'hidden',
  forceItemsVisible: false,
  
  // Chest and prize state
  chestOpened: false,
  prizeState: 'hidden',
  prizeClicked: false,
  
  // Enemy state
  enemyClickable: false,
  enemyHit: false,
  enemyFadingOut: false,
  enemyHealth: 100,
  
  // Sword swing animation state
  swordSwinging: false,
  swingDirection: { x: 0, y: 0 },
  swingProgress: 0,
  swingSpeed: 2.5,
  swingType: 'default',
  
  // Viewport state
  viewportSize: {
    width: window.innerWidth,
    height: window.innerHeight,
    aspectRatio: window.innerWidth / window.innerHeight
  },
  isMobile: false,
  
  // Camera state
  isMovingCamera: false,
  targetCameraPosition: null,
  cameraShaking: {
    isShaking: false,
    intensity: 0.5,
    decay: 0.92,
    maxOffset: 0.3,
    duration: 2000,
    onComplete: null
  },
  
  // Experience timing constants
  initialExperienceDelay: 100,
  moveSpeed: 0.06,
  
  // World configuration
  tileSize: 5,
  tileLocations: [],
  wallLocations: [],
  
  // Experience content
  experienceScript: {
    "prologue": {
      "text": "You open your eyes in the dark."
    },
    "experiences": [
      {
        "experience": 1,
        "position": { x: 5, y: 0, z: 15 },
        "itemPosition": { x: 5, y: 0, z: 17 },
        "type": "item",
        "item": {
          "name": "Lantern", 
          "text": "An old lantern.",
          "color": "yellow"
        }
      },
      {
        "experience": 2,
        "position": { x: 5, y: 0, z: 30 },
        "itemPosition": { x: 5, y: 0, z: 32 },
        "type": "item",
        "item": {
          "name": "Toy Wooden Sword",
          "text": "A toy wooden sword.",
          "color": "brown"
        }
      },
      {
        "experience": 3,
        "position": { x: 5, y: 0, z: 55 },
        "type": "shake",
        "shakeConfig": {
          "intensity": 0.5,
          "duration": 2000,
          "message": "...?"
        }
      },
      {
        "experience": 4,
        "position": { x: 5, y: 0, z: 65 },
        "type": "shake",
        "shakeConfig": {
          "intensity": 0.7,
          "duration": 2000,
          "message": "Something is coming..."
        }
      },
      {
        "experience": 5,
        "position": { x: 5, y: 0, z: 75 },
        "type": "enemy",
        "message": "!!!",
        "nextAction": "sword"
      },
      {
        "experience": 6,
        "position": { x: 5, y: 0, z: 86 },
        "type": "chest",
        "message": "Mine",
        "reward": {
          "name": "SeeYouThere",
          "text": "An artifact of mysterious origins. Its purpose remains unknown, but you feel a strange connection to it.",
          "prizeText": "May 2, 2025 6:00 P.M.\\nFrench Fried Vintage\\n7 Emory Pl, Knoxville, TN 37917",
          "color": "#FFD700"
        }
      }
    ]
  },
  
  // Dungeon layout
  dungeon: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  
  // SCENE LOADING ACTIONS
  setSceneLoaded: (value) => set({ sceneLoaded: value }),
  setLoadingFade: (value) => set({ loadingFade: value }),
  
  // PLAYER ACTIONS
  setPlayerPosition: (position) => set({ playerPosition: position }),
  
  // WORLD CONFIGURATION ACTIONS
  setTileLocations: (tiles) => set({ tileLocations: tiles }),
  setWallLocations: (walls) => set({ wallLocations: walls }),
  setIsMobile: (value) => set({ isMobile: value }),
  updateViewportSize: (dimensions) => set({ viewportSize: dimensions }),
  
  // DOOR INTERACTION ACTIONS
  setDoorClickable: (value) => set({ doorClickable: value }),
  handleDoorClick: (position) => {
    const state = get();
    
    if (state.doorClickable && !state.isDoorClicked) {
      set({ 
        isDoorClicked: true,
        doorPosition: position,
        movingToDoor: true 
      });
      
      set({
        showMessageOverlay: false,
        messageBoxVisible: false,
        showActionOverlay: false
      });
    }
  },
  setPortalEntered: (value) => set({ portalEntered: value }),
  startFadeToBlack: () => set({ fadingToBlack: true }),
  updateBlackScreenOpacity: (opacity) => set({ blackScreenOpacity: opacity }),
  
  // PRIZE AND CHEST ACTIONS
  setChestOpened: (value) => set({ chestOpened: value }),
  setPrizeState: (state) => set({ prizeState: state }),
  setPrizeClicked: (value) => set({ prizeClicked: value }),
  
  // ENEMY ACTIONS
  setEnemyClickable: (value) => set({ enemyClickable: value }),
  setEnemyHit: (value) => set({ enemyHit: value }),
  startEnemyFadeOut: () => set({ enemyFadingOut: true }),
  completeEnemyFadeOut: () => {
    set({ 
      enemyFadingOut: false, 
      enemyHit: false, 
      enemyClickable: false 
    });
    
    setTimeout(() => {
      set({
        showActionOverlay: true,
        actionType: 'move',
        actionDirection: 'forward'
      });
    }, 1000);
  },
  updateEnemyHealth: (damage) => {
    const currentHealth = get().enemyHealth;
    const newHealth = Math.max(0, currentHealth - damage);
    
    set({ enemyHealth: newHealth });
    
    return newHealth === 0;
  },
  handleEnemyClick: () => {
    const state = get();
    const hasSword = state.inventory.some(item => item.name === "Toy Wooden Sword");
    
    if (hasSword && state.enemyClickable && !state.swordSwinging) {
      set({
        showItemDisplay: true,
        forceItemsVisible: true,
        swordSwinging: true,
        swingProgress: 0,
        swingType: 'slash',
        swingDirection: { x: -0.8, y: -0.6 }
      });
      
      setTimeout(() => {
        if (get().swordSwinging) {
          get().completeSwordSwing();
        }
      }, 1000);
    }
  },
  
  // ITEM DISPLAY ACTIONS
  setShowItemDisplay: (value) => set({ showItemDisplay: value }),
  setCurrentItem: (item) => set({ currentItem: item }),
  setItemAnimationPhase: (phase) => set({ itemAnimationPhase: phase }),
  setForceItemsVisible: (value) => set({ forceItemsVisible: value }),
  handleItemClick: () => {
    const state = get();
    const { currentExperienceIndex, experienceScript } = state;
    
    if (currentExperienceIndex >= 0 && state.itemAnimationPhase === 'clickable') {
      const experience = experienceScript.experiences[currentExperienceIndex];
      
      if (experience.type === 'item') {
        set({
          showMessageOverlay: false,
          messageBoxVisible: false,
          showItemDisplay: true,
          itemAnimationPhase: 'acquiring'
        });
      }
    }
  },
  
  // INVENTORY ACTIONS
  addToInventory: (item) => {
    const state = get();
    if (!state.inventory.some(invItem => invItem.name === item.name)) {
      const updatedInventory = [...state.inventory, item];
      
      set({ 
        inventory: updatedInventory,
        itemAnimationPhase: 'acquired',
        showItemDisplay: true,
        forceItemsVisible: true
      });
      
      if (state.currentExperienceIndex < state.experienceScript.experiences.length - 1) {
        setTimeout(() => {
          set({
            showActionOverlay: true,
            actionType: 'move',
            actionDirection: 'forward',
            showItemDisplay: true,
            forceItemsVisible: true
          });
        }, 1000);
      }
    }
  },
  
  // MESSAGE OVERLAY ACTIONS
  setShowMessageOverlay: (value) => {
    const currentShowItemDisplay = get().showItemDisplay;
    const currentForceItemsVisible = get().forceItemsVisible;
    const currentExperienceIndex = get().currentExperienceIndex;
    const experiences = get().experienceScript.experiences;
    
    const isSwordExperience = currentExperienceIndex >= 0 && 
      currentExperienceIndex < experiences.length &&
      experiences[currentExperienceIndex].type === 'item' && 
      experiences[currentExperienceIndex].item?.name === "Toy Wooden Sword";
    
    if (isSwordExperience) {
      set({ 
        showMessageOverlay: value,
        showItemDisplay: true,
        forceItemsVisible: true
      });
    } else {
      set({ 
        showMessageOverlay: value,
        showItemDisplay: value ? currentShowItemDisplay : get().showItemDisplay,
        forceItemsVisible: currentForceItemsVisible
      });
    }
  },
  setMessageBoxVisible: (value) => set({ messageBoxVisible: value }),
  setCurrentMessage: (message) => set({ currentMessage: message }),
  setTypingInProgress: (value) => set({ typingInProgress: value }),
  
  // ACTION OVERLAY ACTIONS
  setShowActionOverlay: (value, type = null, direction = null) => {
    const currentShowItemDisplay = get().showItemDisplay;
    const currentForceItemsVisible = get().forceItemsVisible;
    const hasItems = get().inventory.length > 0;
    
    set({ 
      showActionOverlay: value,
      actionType: type,
      actionDirection: direction,
      showItemDisplay: hasItems ? true : currentShowItemDisplay,
      forceItemsVisible: currentForceItemsVisible
    });
  },
  handleAction: () => {
    const state = get();
    const { actionType, actionDirection, currentExperienceIndex, forceItemsVisible } = state;
    
    if (actionType === 'move' && actionDirection === 'forward') {
      set({ showActionOverlay: false });
      
      let targetIndex = currentExperienceIndex + 1;
      if (targetIndex >= 0 && targetIndex < state.experienceScript.experiences.length) {
        const nextExperience = state.experienceScript.experiences[targetIndex];
        const targetPosition = {
          x: nextExperience.position.x,
          y: state.playerPosition.y,
          z: nextExperience.position.z
        };
        
        const wasEnemyExperience = currentExperienceIndex === 4;
        
        if (wasEnemyExperience) {
          set({ 
            currentExperienceIndex: 5,
            showItemDisplay: true,
            forceItemsVisible: true
          });
        }

        const isSwordExperience = nextExperience.type === 'item' && 
                                 nextExperience.item?.name === "Toy Wooden Sword";
        
        const hasItems = state.inventory.length > 0;
        const hasSword = state.inventory.some(item => item.name === "Toy Wooden Sword");
        
        const keepItemDisplay = nextExperience.type === 'item' || hasItems;
        
        if (isSwordExperience) {
          set({ 
            currentExperienceIndex: targetIndex,
            showItemDisplay: true,
            forceItemsVisible: true
          });
        } else {
          set({ 
            currentExperienceIndex: targetIndex,
            showItemDisplay: keepItemDisplay,
            forceItemsVisible: forceItemsVisible || hasSword
          });
        }
        
        if (nextExperience.type === 'enemy') {
          set({
            enemyClickable: false,
            enemyHit: false,
            enemyFadingOut: false
          });
        }
        
        state.startCameraMovement(targetPosition);
      }
    }
  },
  
  // CAMERA ACTIONS
  startCameraMovement: (targetPosition) => set({ 
    isMovingCamera: true,
    targetCameraPosition: targetPosition
  }),
  stopCameraMovement: () => set({ isMovingCamera: false }),
  startCameraShake: (config, onComplete) => {
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
    
    const newCameraShaking = {
      ...fullConfig,
      isShaking: true
    };
    
    set({ cameraShaking: newCameraShaking });
  },
  stopCameraShake: () => {
    const currentShakeConfig = get().cameraShaking;
    const onComplete = currentShakeConfig.onComplete;
    
    set({ 
      cameraShaking: { ...currentShakeConfig, isShaking: false } 
    });
    
    if (typeof onComplete === 'function') {
      onComplete();
    }
  },
  
  // SWORD SWING ACTIONS
  startSwordSwing: (direction, type = 'default') => {
    const state = get();
    
    const hasSword = state.inventory.some(item => item.name === "Toy Wooden Sword");
    const noOverlays = !state.showMessageOverlay && !state.showActionOverlay;
    
    if (hasSword && noOverlays && !state.swordSwinging) {
      const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      const normalizedDirection = {
        x: direction.x / length,
        y: direction.y / length
      };
      
      set({
        swordSwinging: true,
        swingDirection: normalizedDirection,
        swingProgress: 0,
        swingType: type
      });
      
      setTimeout(() => {
        get().completeSwordSwing();
      }, 700);
    }
  },
  updateSwordSwing: (delta) => {
    set((state) => {
      if (!state.swordSwinging) return state;
      
      const progressIncrement = delta * 0.5;
      const newProgress = state.swingProgress + progressIncrement;
      
      if (newProgress >= 1) {
        return {
          swordSwinging: false,
          swingProgress: 0
        };
      }
      
      return {
        swingProgress: newProgress
      };
    });
  },
  completeSwordSwing: () => {
    set({
      swordSwinging: false,
      swingProgress: 0
    });
  },
  
  // EXPERIENCE FLOW ACTIONS
  startExperience: () => {
    set({
      showMessageOverlay: true,
      messageBoxVisible: true,
      currentExperienceIndex: -1,
      currentMessage: get().experienceScript.prologue.text,
      typingInProgress: true,
      showItemDisplay: true,
      itemAnimationPhase: 'hidden'
    });
  },
  progressExperience: () => {
    const state = get();
    const { currentExperienceIndex, experienceScript, inventory, forceItemsVisible } = state;
    
    const hasAcquiredItems = inventory.length > 0;
    const hasSword = inventory.some(item => item.name === "Toy Wooden Sword");
    
    const isSwordExperience = currentExperienceIndex >= 0 && 
      currentExperienceIndex < experienceScript.experiences.length &&
      experienceScript.experiences[currentExperienceIndex].type === 'item' && 
      experienceScript.experiences[currentExperienceIndex].item?.name === "Toy Wooden Sword";
    
    if (isSwordExperience) {
      set({
        showItemDisplay: true,
        forceItemsVisible: true
      });
    }
    
    if (currentExperienceIndex === -1) {
      set({
        showMessageOverlay: false,
        messageBoxVisible: false,
        showActionOverlay: true,
        actionType: 'move',
        actionDirection: 'forward',
        showItemDisplay: hasAcquiredItems ? true : state.showItemDisplay,
        forceItemsVisible: forceItemsVisible || hasSword || isSwordExperience
      });
    } else {
      if (state.showMessageOverlay) {
        const experience = experienceScript.experiences[currentExperienceIndex];
        
        const isSwordExperience = experience.type === 'item' && 
                                 experience.item.name === "Toy Wooden Sword";
        
        if (experience.type === 'shake' && state.currentMessage === experience.shakeConfig.message) {
          if (currentExperienceIndex === 3) {
            const nextExperienceIndex = currentExperienceIndex + 1;
            
            set({
              showMessageOverlay: false,
              messageBoxVisible: false,
              currentExperienceIndex: nextExperienceIndex,
              showItemDisplay: true,
              forceItemsVisible: true,
              enemyClickable: false,
              enemyHit: false,
              enemyFadingOut: false
            });
          } else {
            set({
              showMessageOverlay: false,
              messageBoxVisible: false,
              showActionOverlay: true,
              actionType: 'move',
              actionDirection: 'forward',
              showItemDisplay: hasAcquiredItems ? true : state.showItemDisplay,
              forceItemsVisible: forceItemsVisible || hasSword || isSwordExperience
            });
          }
        } 
        else if (experience.type === 'item' && state.currentMessage === experience.item.text) {
          set({
            showMessageOverlay: false,
            messageBoxVisible: false,
            showItemDisplay: true,
            itemAnimationPhase: 'clickable',
            forceItemsVisible: true
          });
        }
        else if (experience.type === 'enemy' && state.currentMessage === experience.message) {
          set({
            showMessageOverlay: false,
            messageBoxVisible: false,
            showItemDisplay: true,
            forceItemsVisible: true,
            enemyClickable: true
          });
        }
        else if (experience.type === 'chest' && state.currentMessage === experience.message) {
          set({
            showMessageOverlay: false,
            messageBoxVisible: false,
            showItemDisplay: true,
            forceItemsVisible: true
          });
        }
      }
    }
  }
}));

export default useGameStore;