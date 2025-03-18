import { create } from 'zustand';

const useGameStore = create((set) => ({
  playerPosition: { x: 0, y: 0, z: 0 },
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
  
  // Magic System
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

  // Dungeon Properties
  gridSize: 5,
  tileSize: 5,
  wallThickness: 1,

  currentRoom: {
    position: { x: 0, y: 0, z: 0 },
    size: 5,
  },

  spawnPoints: {
    player: { x: 0, y: 1.5, z: 0 },
    enemy: { x: 0, y: 1.5, z: 0 },
  },

  // Store Mutations
  setPlayerPosition: (position) => set({ playerPosition: position }),
  setTileLocations: (tiles) => set({ tileLocations: tiles }),
  setWallLocations: (walls) => set({ wallLocations: walls }),
  setEnemySpawnPoint: (spawnPoint) =>
    set((state) => ({
      spawnPoints: { ...state.spawnPoints, enemy: spawnPoint },
    })),
  setPlayerSpawnPoint: (spawnPoint) =>
    set((state) => ({
      spawnPoints: { ...state.spawnPoints, player: spawnPoint },
    })),
  setEquippedMagic: (magic) => set({ equippedMagic: magic }),
  addProjectile: (projectile) => set((state) => ({ projectiles: [...state.projectiles, projectile] })),
  removeProjectile: (id) => set((state) => ({ projectiles: state.projectiles.filter(p => p.id !== id) })),
}));

export default useGameStore;
