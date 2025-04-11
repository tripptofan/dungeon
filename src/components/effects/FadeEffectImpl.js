import { Effect } from 'postprocessing';
import { Uniform } from 'three';

// Custom shader effect for fading in/out
export class FadeEffectImpl extends Effect {
  constructor() {
    super(
      'FadeEffect',
      // Fragment shader that applies the fade
      /* glsl */`
        uniform float opacity;
        
        void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
          // Blend the scene color with black based on opacity
          outputColor = mix(inputColor, vec4(0.0, 0.0, 0.0, 1.0), opacity);
        }
      `,
      {
        blendFunction: 1, // NORMAL blend
        uniforms: new Map([['opacity', new Uniform(1.0)]])
      }
    );
  }

  // Method to directly set the opacity value
  setOpacity(value) {
    this.uniforms.get('opacity').value = value;
  }
}