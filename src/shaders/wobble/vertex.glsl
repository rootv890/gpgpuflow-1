varying vec2 vUv;
attribute vec4 tangent;
uniform float uTime;
uniform float uPositionFrequency;
uniform float uTimeFrequency;
uniform float uStrength;
uniform float uWarppedPositionFrequency;
uniform float uWarppedTimeFrequency;
uniform float uWarppedStrength;
uniform float uShift;


varying float vWobble;
varying vec3 vPosition;
// varying vec3 vNormal;
#include ../includes/simplexNoise4d.glsl


float getWobble(vec3 position)
{
    vec3 warpedPosition = position;
    warpedPosition += simplexNoise4d(
        vec4(
            position * uWarppedPositionFrequency,
            uTime * uWarppedTimeFrequency
        )
    ) * uWarppedStrength;

    return simplexNoise4d(vec4(
        warpedPosition * uPositionFrequency, // XYZ
        uTime * uTimeFrequency         // W
    )) * uStrength;
}



void main()
{   
  vec3 biTangent = cross(normal, tangent.xyz);

  // Neighbour Positions
  float shift = uShift ; // How much to shift the position 

  // Neighbours
  vec3 positionA =  csm_Position + tangent.xyz * shift;
  vec3 positionB =  csm_Position + biTangent * shift;

  // Wobble the positions
  float wobble  = getWobble(csm_Position);

  // Update the csm_position
  csm_Position += wobble * normal;

  positionA     += getWobble(positionA) * normal;
  positionB     += getWobble(positionB) * normal;
  
  // Normalize for Directions
  vec3 toA =  normalize(positionA - csm_Position);
  vec3 toB =  normalize(positionB - csm_Position); 

  // Update the Normal for proper lighting etc..
    csm_Normal =  cross(toA, toB);

   
 


    // Varying
    vWobble = wobble;
    vPosition = csm_Position;
    
} 