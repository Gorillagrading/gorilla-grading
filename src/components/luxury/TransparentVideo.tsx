import React, { useEffect, useRef, useState } from 'react';

interface TransparentVideoProps {
  src: string;
  poster?: string;
  className?: string;
  similarity?: number;
  smoothness?: number;
}

export const TransparentVideo: React.FC<TransparentVideoProps> = ({
  src,
  poster,
  className = 'w-full h-auto object-contain pointer-events-none select-none bg-transparent',
  similarity = 0.07,
  smoothness = 0.08
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const gl = canvas.getContext('webgl', { 
      alpha: true, 
      premultipliedAlpha: false,
      preserveDrawingBuffer: false 
    });

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    // Vertex Shader
    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    // Fragment Shader - Realtime Studio Chroma Keyer (Autodetects backdrop color)
    const fsSource = `
      precision mediump float;
      uniform sampler2D u_image;
      uniform float u_similarity;
      uniform float u_smoothness;
      varying vec2 v_texCoord;

      void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        
        // Sample pure background color from top corners of the video frame
        vec3 keyTopLeft = texture2D(u_image, vec2(0.015, 0.985)).rgb;
        vec3 keyTopRight = texture2D(u_image, vec2(0.985, 0.985)).rgb;
        vec3 keyColor = (keyTopLeft + keyTopRight) * 0.5;
        
        // Color distance in RGB space
        float diff = distance(color.rgb, keyColor);
        
        // Soft matte extraction
        float alpha = smoothstep(u_similarity, u_similarity + u_smoothness, diff);
        
        // Micro edge vignette to eliminate video boundary edges
        float edgeX = min(v_texCoord.x, 1.0 - v_texCoord.x);
        float edgeY = min(v_texCoord.y, 1.0 - v_texCoord.y);
        float edgeFade = smoothstep(0.0, 0.02, min(edgeX, edgeY));
        
        alpha = alpha * edgeFade;
        
        gl_FragColor = vec4(color.rgb, alpha);
      }
    `;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry (2 triangles)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Texture coords
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        1.0, 1.0,
      ]),
      gl.STATIC_DRAW
    );

    const aTexCoord = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

    // Texture setup
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Uniform locations
    const uSimilarity = gl.getUniformLocation(program, 'u_similarity');
    const uSmoothness = gl.getUniformLocation(program, 'u_smoothness');
    gl.uniform1f(uSimilarity, similarity);
    gl.uniform1f(uSmoothness, smoothness);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let animationFrameId: number;
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      if (video.readyState >= 2 && !video.paused) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          gl.viewport(0, 0, canvas.width, canvas.height);
          setIsReady(true);
        }

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    video.play().catch(() => {
      // Autoplay might require user interaction or already muted
    });

    render();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (texCoordBuffer) gl.deleteBuffer(texCoordBuffer);
      if (texture) gl.deleteTexture(texture);
      if (program) gl.deleteProgram(program);
    };
  }, [src, similarity, smoothness]);

  if (!webglSupported) {
    return (
      <video
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        className={className}
      />
    );
  }

  return (
    <div className="relative w-full h-auto flex items-center justify-center">
      {/* Hidden Source Video */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="hidden"
        style={{ display: 'none' }}
      />

      {/* Poster Placeholder before first frame renders */}
      {poster && !isReady && (
        <img
          src={poster}
          alt="Video preview"
          className={className}
        />
      )}

      {/* Realtime Chroma Key Canvas (Transparent Video Output) */}
      <canvas
        ref={canvasRef}
        className={`${className} ${!isReady && poster ? 'hidden' : 'block'}`}
      />
    </div>
  );
};
