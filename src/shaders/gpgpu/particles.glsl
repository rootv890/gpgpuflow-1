#include ../includes/simplexNoise4d.glsl
uniform float uTime;
uniform float uDeltaTime;
uniform float uFlowFlieldInfluence;
uniform float uFlowFlieldStrength;
uniform float uFlowFlieldFrequency;
uniform sampler2D uBase;

// Fragment Shader
void main()
{

  float time = uTime *.2;

  vec2  uv =  gl_FragCoord.xy/resolution.xy;
  vec4 particle =  texture(uParticles, uv);
  vec4 base =  texture(uBase, uv);

  // Dead
  if(particle.a >= 1.0){
    particle.a = mod(particle.a,1.0);
    particle.xyz = base.xyz;
  }

  // Alive
  else
  {

    // Strength
    float strength =  simplexNoise4d(vec4(base.xyz * 0.2,time+1.0));
    float influence =  (uFlowFlieldInfluence  - 0.5) * (-2.0);
    strength = smoothstep(influence, 1.0, strength);

  vec3 flowField =  vec3(
    simplexNoise4d(vec4(particle.xyz * uFlowFlieldFrequency  +0.0,time)),
    simplexNoise4d(vec4(particle.xyz * uFlowFlieldFrequency  +1.0,time)),
    simplexNoise4d(vec4(particle.xyz * uFlowFlieldFrequency  +2.0,time))
  );

  flowField = normalize(flowField);
  particle.xyz += flowField * uDeltaTime * strength *  uFlowFlieldStrength;
  
  // Decay
  particle.a +=uDeltaTime * 0.3;
  
  }

  gl_FragColor =  particle;

}


