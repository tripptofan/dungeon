import { create } from 'zustand';

const useGameStore = create((set) => ({
  sceneLoaded: false, // Track if the scene is loaded
  setSceneLoaded: (value) => set({ sceneLoaded: value }), // Mutation to update sceneLoaded state
  loadingFade: false,
  setLoadingFade: (value) => set({ loadingFade: value }), // Mutation to update loadingFade state
  // Initial state
  playerPosition: { x: 0, z: 0 },
  playerHealth: 100,
  playerMana: 100,
  playerLevel: 1,
  playerInventory: [],
  equippedWeapon: null,
  equippedMagic: null,
  potionBelt: [],
  tileLocations: [],
  wallLocations: [],
  doorLocations: [],
  projectiles: [],
  godMode: false,
  inBattle: false,
  learnedMagic: {
    fireball: {
      name: "Fireball",
      id: "fireball",
      travelSpeed: 0.2,
      cooldown: 2,
      damage: 10,
      element: "fire",
      color: "red",
    },
    ice: {
      name: "Ice Shard",
      id: "ice",
      travelSpeed: 0.15,
      cooldown: 3,
      damage: 8,
      element: "ice",
      color: "blue",
    },
    lightning: {
      name: "Lightning Bolt",
      id: "lightning",
      travelSpeed: 0.3,
      cooldown: 1.5,
      damage: 12,
      element: "lightning",
      color: "white",
    },
  },

  // Dungeon properties
  gridSize: 5,
  tileSize: 5,
  wallThickness: 1,
  currentRoom: { position: { x: 0, y: 0, z: 0 }, size: 5 },
  spawnPoints: { player: { x: 0, y: 1.5, z: 0 }, enemy: { x: 0, y: 1.5, z: 0 } },
  playerSpawnPoint: { x: 2, z: 1 },
  dungeon: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  //Script
  experienceScript: {
    "prologue": {
      "text": "You open your eyes in the dark. You think you've been here before—but maybe it was only a dream."
    },
    "experiences": [
      {
        "experience": 1,
        "text": "The path ahead is unfolding, though it’s a little hard to see where it goes. Trust that it will make sense eventually, but only if you stop trying to control it.",
        "item": {
          "name": "Candle",
          "text": "This candle holds a quiet flame. Sometimes, even the smallest light is enough.",
          "interpretation": "The candle represents the first step into the unknown and finding guidance, even in uncertainty."
        }
      },
      {
        "experience": 2,
        "text": "How long have you been here? The world moves, but you’ve stayed in place. It’s time to let go of what’s holding you back.",
        "item": {
          "name": "Broken Watch",
          "text": "This broken watch is stuck in time. Maybe there’s a way to fix it.",
          "interpretation": "The broken watch symbolizes being stuck in time, both in your actions and your way of thinking, preventing change."
        }
      },
      {
        "experience": 3,
        "text": "Things have been left unsaid for far too long. What’s been waiting to be revealed?",
        "item": {
          "name": "Envelope",
          "text": "A letter that was never sent. One day, you may find the courage.",
          "interpretation": "The envelope signifies missed opportunities or unexpressed thoughts, representing the need to speak your truth and take action."
        }
      },
      {
        "experience": 4,
        "text": "There’s someone here... the presence is strangely familiar.",
        "item": {
          "name": "Compact Mirror",
          "text": "This mirror shows your reflection, but not always how you see yourself.",
          "interpretation": "The compact mirror encourages self-reflection, both literal and figurative, helping the user recognize how they view themselves and the truth they may not yet see."
        }
      },
      {
        "experience": 5,
        "text": "You know what you need to do, now find the strength.",
        "item": {
          "name": "Toy Wooden Sword",
          "text": "A toy wooden sword. It’s not much, but it may prove useful.",
          "interpretation": "The toy sword, though unassuming, symbolizes latent power, representing the strength gained through self-awareness and reflection to move forward."
        }
      }
    ]
  },
  

  // New isMobile state for detecting mobile devices
  isMobile: true,

  // Movement States
  moveUp: false,
  moveDown: false,
  moveLeft: false,
  moveRight: false,

  // Store mutations for movement
  setMoveUp: (value) => set({ moveUp: value }),
  setMoveDown: (value) => set({ moveDown: value }),
  setMoveLeft: (value) => set({ moveLeft: value }),
  setMoveRight: (value) => set({ moveRight: value }),

  // Store mutations
  setPlayerPosition: (position) => set({ playerPosition: position }),
  setTileLocations: (tiles) => set({ tileLocations: tiles }),
  setWallLocations: (walls) => set({ wallLocations: walls }),
  setEquippedMagic: (magic) => set({ equippedMagic: magic }),
  addProjectile: (projectile) => set((state) => ({ projectiles: [...state.projectiles, projectile] })),
  removeProjectile: (id) => set((state) => ({ projectiles: state.projectiles.filter(p => p.id !== id) })),
  setGodMode: (value) => set({ godMode: value }),
  setInBattle: (value) => set({ inBattle: value }),
  setIsMobile: (value) => set({ isMobile: value }),
}));

export default useGameStore;
