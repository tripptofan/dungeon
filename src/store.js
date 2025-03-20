import { create } from 'zustand';

const useGameStore = create((set) => ({
  // Initial state
  playerPosition: { x: 2, z: 1 },
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
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],

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
