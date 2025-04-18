import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Create a context to share loaded textures
const TextureContext = createContext({});

// Cache for textures - improves performance by preventing duplicate loads
const textureCache = new Map();

// Cache for LoD materials - store both high and low detail versions
const materialCache = new Map();

/**
 * Utility function to load a texture with caching
 * @param {string} path - The texture file path
 * @param {Object} options - Configuration options
 * @returns {THREE.Texture} The loaded texture
 */
const loadCachedTexture = (path, options = {}) => {
  if (textureCache.has(path)) {
    return textureCache.get(path);
  }

  const texture = new THREE.TextureLoader().load(path);
  
  // Apply standard options
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  // Apply custom options
  if (options.repeat) {
    texture.repeat.set(options.repeat[0], options.repeat[1]);
  }
  
  textureCache.set(path, texture);
  return texture;
};

/**
 * TextureSets - Manages texture sets for different materials
 * Centralizes texture management and reduces duplicate texture loading
 */
class TextureSets {
  constructor() {
    this.sets = {
      floor: {
        color: "/textures/dungeonFloor/dungeonFloor.png",
        // Commented out additional texture maps to improve performance
        // ao: "/textures/dungeonFloor/AmbientOcclusionMap.png",
        // normal: "/textures/dungeonFloor/NormalMap.png",
      },
      wall: {
        color: "/textures/dungeonWall/dungeonWall.png",
        // Commented out additional texture maps to improve performance
        // ao: "/textures/dungeonWall/AmbientOcclusionMap.png",
        // normal: "/textures/dungeonWall/NormalMap.png",
      },
      door: {
        color: "/textures/dungeonDoor/dungeonDoor.png",
        open: "/textures/dungeonDoorOpen.png",
        // Commented out additional texture maps to improve performance
        // ao: "/textures/dungeonDoor/AmbientOcclusionMap.png",
        // normal: "/textures/dungeonDoor/NormalMap.png",
      }
    };
  }

  /**
   * Load a complete texture set
   * @param {string} setName - The texture set name
   * @param {Object} options - Configuration options
   * @returns {Object} The loaded texture set
   */
  loadSet(setName, options = {}) {
    if (!this.sets[setName]) {
      console.error(`Texture set '${setName}' not found`);
      return null;
    }

    const set = this.sets[setName];
    const loadedSet = {};

    for (const [key, path] of Object.entries(set)) {
      loadedSet[key] = loadCachedTexture(path, options);
    }

    return loadedSet;
  }

  /**
   * Create a material from a texture set with LoD support
   * @param {string} setName - The texture set name
   * @param {Object} materialOptions - Material configuration options
   * @param {Object} textureOptions - Texture configuration options
   * @param {boolean} forceHighDetail - Force high detail regardless of LoD settings
   * @returns {THREE.Material} The created material
   */
  createMaterial(setName, materialOptions = {}, textureOptions = {}, forceHighDetail = false) {
    // Check if we already have this material in cache
    const cacheKey = `${setName}-${forceHighDetail ? 'high' : 'low'}-${JSON.stringify(materialOptions)}`;
    if (materialCache.has(cacheKey)) {
      return materialCache.get(cacheKey);
    }

    const textureSet = this.loadSet(setName, textureOptions);
    if (!textureSet) return null;

    // Default material properties based on the set type
    const defaults = this.getDefaultMaterialProperties(setName);
    
    // Merge defaults with custom options
    const options = { ...defaults, ...materialOptions };
    
    // Create the material with only the color texture map
    const material = new THREE.MeshStandardMaterial({
      map: textureSet.color,
      // All other texture maps have been commented out
      // Note: Even in high detail mode, we're only using color maps now
      // ...(forceHighDetail ? {
      //   aoMap: textureSet.ao,
      //   normalMap: textureSet.normal,
      // } : {}),
      ...options
    });

    // Adjust material properties for low detail version
    if (!forceHighDetail) {
      // Simplify roughness/metalness for better performance
      material.roughness = Math.min(material.roughness + 0.2, 1.0);
      material.metalness = Math.max(material.metalness - 0.1, 0);
      
      // This is redundant now since we're not using these maps at all
      // but keeping the code for reference
      material.normalScale = new THREE.Vector2(0, 0);
      material.aoMapIntensity = 0;
    }

    // Cache the material
    materialCache.set(cacheKey, material);
    return material;
  }

  /**
   * Create a door material based on its open state
   * @param {boolean} isOpen - Whether the door is open
   * @param {Object} materialOptions - Material configuration options
   * @param {Object} textureOptions - Texture configuration options
   * @param {boolean} forceHighDetail - Force high detail regardless of LoD settings
   * @returns {THREE.Material} The created door material
   */
  createDoorMaterial(isOpen = false, materialOptions = {}, textureOptions = {}, forceHighDetail = false) {
    // Create a unique cache key for this door material
    const cacheKey = `door-${isOpen ? 'open' : 'closed'}-${forceHighDetail ? 'high' : 'low'}-${JSON.stringify(materialOptions)}`;
    if (materialCache.has(cacheKey)) {
      return materialCache.get(cacheKey);
    }

    const textureSet = this.loadSet('door', textureOptions);
    if (!textureSet) return null;

    // Default material properties
    const defaults = this.getDefaultMaterialProperties('door');
    
    // Merge defaults with custom options
    const options = { ...defaults, ...materialOptions };
    
    // Create the material with the appropriate texture based on door state
    const material = new THREE.MeshStandardMaterial({
      map: isOpen ? textureSet.open : textureSet.color,
      ...options
    });

    // Adjust material properties for low detail version
    if (!forceHighDetail) {
      material.roughness = Math.min(material.roughness + 0.2, 1.0);
      material.metalness = Math.max(material.metalness - 0.1, 0);
      material.normalScale = new THREE.Vector2(0, 0);
      material.aoMapIntensity = 0;
    }

    // Cache the material
    materialCache.set(cacheKey, material);
    return material;
  }

  /**
   * Get default material properties based on type
   * @param {string} setName - The texture set name
   * @returns {Object} Default material properties
   */
  getDefaultMaterialProperties(setName) {
    const defaults = {
      floor: {
        // We're not using aoMap anymore, but keeping the default values
        // for reference and in case we re-enable them later
        aoMapIntensity: 0.6,
        normalScale: new THREE.Vector2(0.6, 0.6),
        roughness: 1.0,
        metalness: 0.2
      },
      wall: {
        color: new THREE.Color(0xf0e6ff), // Light lavender tint
        aoMapIntensity: 0.5,
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughness: 1.0,
        metalness: 0.1
      },
      door: {
        aoMapIntensity: 0.7,
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughness: 0.6,
        metalness: 0.3
      }
    };

    return defaults[setName] || {};
  }
}

/**
 * Provider component to load and share textures across the app
 * Handles loading, caching and creating optimized materials
 */
export const TextureProvider = ({ children, onProgress }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { invalidate } = useThree();
  
  // Create a singleton instance of TextureSets
  const textureSets = useMemo(() => new TextureSets(), []);
  
  // Pre-load all texture sets and cache them
  useEffect(() => {
    setIsLoading(true);
    setLoadingProgress(0);
    
    const textureSetNames = Object.keys(textureSets.sets);
    const totalSets = textureSetNames.length;
    let loadedSets = 0;
    
    // Load all texture sets
    const loadAllSets = async () => {
      for (const setName of textureSetNames) {
        const textureSet = textureSets.loadSet(setName);
        
        // Wait for all textures in the set to load
        await Promise.all(
          Object.values(textureSet).map(
            texture => new Promise(resolve => {
              if (texture.image) {
                resolve();
              } else {
                texture.onUpdate = () => resolve();
              }
            })
          )
        );
        
        // Update progress
        loadedSets++;
        const progressValue = (loadedSets / totalSets) * 100;
        setLoadingProgress(progressValue);
        
        // Call the onProgress callback if provided
        if (typeof onProgress === 'function') {
          onProgress(progressValue);
        }
      }
      
      setIsLoading(false);
      invalidate(); // Force a re-render when all textures are loaded
    };
    
    loadAllSets();
  }, [textureSets, invalidate, onProgress]);
  
  // Create shared materials - both high and low detail versions
  const materials = useMemo(() => {
    return {
      // High detail materials
      floorMaterial: textureSets.createMaterial('floor', {}, {}, true),
      wallMaterial: textureSets.createMaterial('wall', {}, {}, true),
      doorMaterial: textureSets.createMaterial('door', {}, {}, true),
      doorOpenMaterial: textureSets.createDoorMaterial(true, {}, {}, true),
      
      // Low detail materials
      floorMaterialLod: textureSets.createMaterial('floor', {}, {}, false),
      wallMaterialLod: textureSets.createMaterial('wall', {}, {}, false),
      doorMaterialLod: textureSets.createMaterial('door', {}, {}, false),
      doorOpenMaterialLod: textureSets.createDoorMaterial(true, {}, {}, false)
    };
  }, [textureSets]);
  
  // Create the context value
  const contextValue = useMemo(() => {
    return {
      textureSets,
      materials,
      isLoading,
      loadingProgress,
      // Helper function to create a custom material
      createCustomMaterial: (setName, options, highDetail = true) => 
        textureSets.createMaterial(setName, options, {}, highDetail),
      // Helper function for door materials with open state
      createDoorMaterial: (isOpen, options, highDetail = true) => 
        textureSets.createDoorMaterial(isOpen, options, {}, highDetail)
    };
  }, [textureSets, materials, isLoading, loadingProgress]);
  
  return (
    <TextureContext.Provider value={contextValue}>
      {children}
    </TextureContext.Provider>
  );
};

// Hook to access textures and materials
export const useTextures = () => useContext(TextureContext);