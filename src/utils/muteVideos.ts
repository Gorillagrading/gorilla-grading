/**
 * Todos los videos de la web son decorativos y deben estar siempre en silencio.
 * Los archivos ya no llevan pista de audio; esto es una segunda barrera por si algún día se sube uno con sonido:
 * silencia cada <video> en cuanto aparece (también los que React crea después) y lo vuelve a silenciar si algo lo desmutea.
 */
const silence = (video: HTMLVideoElement) => {
  video.defaultMuted = true;
  video.muted = true;
  video.volume = 0;
  video.setAttribute('muted', '');
  if (!video.dataset.silenced) {
    video.dataset.silenced = '1';
    video.addEventListener('volumechange', () => {
      if (!video.muted || video.volume !== 0) {
        video.muted = true;
        video.volume = 0;
      }
    });
    // React no siempre deja el atributo muted al volver a montar un video: se refuerza al empezar a reproducir.
    video.addEventListener('play', () => silence(video));
  }
};

export function keepVideosMuted() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('video').forEach(silence);
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node instanceof HTMLVideoElement) silence(node);
        else if (node instanceof Element) node.querySelectorAll('video').forEach(silence);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
}
