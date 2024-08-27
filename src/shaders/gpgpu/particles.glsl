// Fragment Shader
void main()
{
  vec2  uv =  gl_FragCoord.xy/resolution.xy;

  vec4 particle =  texture(uParticles, uv);
  // gl_FragColor =  vec4( uv
  //   , 1.0,1.0);
  particle.y+=.01; // incrmenting green channel
  gl_FragColor =  particle;

}


