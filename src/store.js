import { create } from 'zustand';

// Create a simplified store with better performance patterns
const useGameStore = create((set, get) => ({
  // Scene loading state - fundamental app state
  sceneLoaded: false,
  loadingFade: false,
  
  // Player state
  playerPosition: { x: 0, y: 2, z: 0 },
  
  // World configuration
  tileSize: 5,
  tileLocations: [],
  wallLocations: [],
  isMobile: false,
  
  // Experience content
  experienceScript: {
    "prologue": {
      "text": "You open your eyes in the dark. You think you've been here before—but maybe it was only a dream."
    },
    "experiences": [
      {
        "experience": 1,
        "text": "The path ahead is unfolding, though it's a little hard to see where it goes. Trust that it will make sense eventually, but only if you stop trying to control it.",
        "item": {
          "name": "Candle",
          "text": "This candle holds a quiet flame. Sometimes, even the smallest light is enough.",
          "interpretation": "The candle represents the first step into the unknown and finding guidance, even in uncertainty."
        }
      },
      // Other experiences remain the same...
    ]
  },
  
  // Dungeon layout
  dungeon: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  
  // Action dispatchers - simplified to core functionality
  setSceneLoaded: (value) => set({ sceneLoaded: value }),
  setLoadingFade: (value) => set({ loadingFade: value }),
  setPlayerPosition: (position) => set({ playerPosition: position }),
  setTileLocations: (tiles) => set({ tileLocations: tiles }),
  setWallLocations: (walls) => set({ wallLocations: walls }),
  setIsMobile: (value) => set({ isMobile: value }),
  
  // Additional experience state will be added back once the core is working
}));

export default useGameStore;