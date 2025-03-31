import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Create a context to share loaded textures
const TextureContext = createContext({});

// Cache for textures - improves performance by preventing duplicate loads
const textureCache = new Map();

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
        ao: "/textures/dungeonFloor/AmbientOcclusionMap.png",
        displacement: "/textures/dungeonFloor/DisplacementMap.png",
        normal: "/textures/dungeonFloor/NormalMap.png",
        specular: "/textures/dungeonFloor/SpecularMap.png"
      },
      wall: {
        color: "/textures/dungeonWall/dungeonWall.png",
        ao: "/textures/dungeonWall/AmbientOcclusionMap.png",
        displacement: "/textures/dungeonWall/DisplacementMap.png",
        normal: "/textures/dungeonWall/NormalMap.png",
        specular: "/textures/dungeonWall/SpecularMap.png"
      },
      ceiling: {
        color: "/textures/ceilingTexture/ceilingTexture.png",
        ao: "/textures/ceilingTexture/AmbientOcclusionMap.png",
        displacement: "/textures/ceilingTexture/DisplacementMap.png",
        normal: "/textures/ceilingTexture/NormalMap.png",
        specular: "/textures/ceilingTexture/SpecularMap.png"
      },
      door: {
        color: "/textures/dungeonDoor/dungeonDoor.png",
        ao: "/textures/dungeonDoor/AmbientOcclusionMap.png",
        displacement: "/textures/dungeonDoor/DisplacementMap.png",
        normal: "/textures/dungeonDoor/NormalMap.png",
        specular: "/textures/dungeonDoor/SpecularMap.png"
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
   * Create a material from a texture set
   * @param {string} setName - The texture set name
   * @param {Object} materialOptions - Material configuration options
   * @param {Object} textureOptions - Texture configuration options
   * @returns {THREE.Material} The created material
   */
  createMaterial(setName, materialOptions = {}, textureOptions = {}) {
    const textureSet = this.loadSet(setName, textureOptions);
    if (!textureSet) return null;

    // Default material properties based on the set type
    const defaults = this.getDefaultMaterialProperties(setName);
    
    // Merge defaults with custom options
    const options = { ...defaults, ...materialOptions };
    
    // Create the material with textures and options
    const material = new THREE.MeshStandardMaterial({
      map: textureSet.color,
      aoMap: textureSet.ao,
      displacementMap: textureSet.displacement,
      normalMap: textureSet.normal,
      roughnessMap: textureSet.specular,
      ...options
    });

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
        aoMapIntensity: 0.6,
        displacementScale: 0.02,
        normalScale: new THREE.Vector2(0.6, 0.6),
        roughness: 1.8,
        metalness: 0.2,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.01
      },
      wall: {
        color: new THREE.Color(0xf0e6ff), // Light lavender tint
        aoMapIntensity: 0.5,
        displacementScale: 0.5,
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughness: 1.6,
        metalness: 0.1,
        emissive: new THREE.Color(0xffe8f5),
        emissiveIntensity: 0.01
      },
      ceiling: {
        aoMapIntensity: 0.5,
        displacementScale: 0.4,
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughness: 2.7,
        metalness: 0.3,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0,
        side: THREE.DoubleSide
      },
      door: {
        aoMapIntensity: 0.7,
        displacementScale: 0.1,
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughness: 0.6,
        metalness: 0.3,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.02
      }
    };

    return defaults[setName] || {};
  }
}

/**
 * Provider component to load and share textures across the app
 * Handles loading, caching and creating optimized materials
 */
export const TextureProvider = ({ children }) => {
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
        setLoadingProgress((loadedSets / totalSets) * 100);
      }
      
      setIsLoading(false);
      invalidate(); // Force a re-render when all textures are loaded
    };
    
    loadAllSets();
  }, [textureSets, invalidate]);
  
  // Create shared materials - these are created once and reused
  const materials = useMemo(() => {
    return {
      floorMaterial: textureSets.createMaterial('floor'),
      wallMaterial: textureSets.createMaterial('wall'),
      ceilingMaterial: textureSets.createMaterial('ceiling'),
      doorMaterial: textureSets.createMaterial('door')
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
      createCustomMaterial: (setName, options) => textureSets.createMaterial(setName, options)
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