import React, { useEffect, useRef, useState } from 'react';

interface AlphaVideoProps {
  /** H.264 MP4 with color in the top half and the alpha matte (grayscale) in the bottom half */
  stackedSrc: string;
  /** VP9 WebM with native alpha, used when WebGL is unavailable */
  webmSrc?: string;
  poster?: string;
  className?: string;
}

/**
 * Plays a "stacked alpha" video with real transparency on every browser (Safari included),
 * so the same file sits cleanly on both the light and dark themes.
 */
export const AlphaVideo: React.FC<AlphaVideoProps> = ({
  stackedSrc,
  webmSrc,
  poster,
  className = 'w-full h-auto pointer-events-none select-none'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
    if (!gl) {
      setWebglSupported(false);
      return;
    }

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_uv = a_position * 0.5 + 0.5;
      }
    `;

    // Top half = color, bottom half = alpha matte
    const fsSource = `
      precision mediump float;
      uniform sampler2D u_video;
      varying vec2 v_uv;
      void main() {
        vec3 color = texture2D(u_video, vec2(v_uv.x, 0.5 + v_uv.y * 0.5)).rgb;
        float alpha = texture2D(u_video, vec2(v_uv.x, v_uv.y * 0.5)).r;
        gl_FragColor = vec4(color * alpha, alpha);
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

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    let animationFrameId: number;
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      if (video.readyState >= 2) {
        const w = video.videoWidth;
        const h = video.videoHeight / 2;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
          setIsReady(true);
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      animationFrameId = requestAnimationFrame(render);
    };

    video.play().catch(() => {
      // Autoplay can be blocked; the muted attribute normally allows it
    });
    render();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      gl.deleteBuffer(positionBuffer);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
    };
  }, [stackedSrc]);

  if (!webglSupported && webmSrc) {
    return <video src={webmSrc} poster={poster} autoPlay loop muted playsInline className={className} />;
  }

  return (
    <div className="relative w-full">
      <video ref={videoRef} src={stackedSrc} autoPlay loop muted playsInline style={{ display: 'none' }} />
      {poster && !isReady && <img src={poster} alt="" className={className} />}
      <canvas ref={canvasRef} className={`${className} ${!isReady && poster ? 'hidden' : 'block'}`} />
    </div>
  );
};
