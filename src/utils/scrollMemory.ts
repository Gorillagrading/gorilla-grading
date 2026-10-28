/**
 * Recuerda en qué punto de cada página estaba la persona, para que la flecha "atrás" (y
 * "adelante") del navegador la devuelva exactamente allí. La posición se guarda en el estado
 * de cada entrada del historial, así que también sobrevive a recargas y a salir de la web.
 */

type ScrollState = { scrollY?: number } | null;

const savedState = (): Record<string, unknown> => ({ ...((window.history.state as object | null) ?? {}) });

/** Guarda la posición actual en la entrada del historial en la que estamos. */
export function rememberScroll() {
  try {
    window.history.replaceState({ ...savedState(), scrollY: window.scrollY }, '');
  } catch {
    // Algunos navegadores limitan replaceState; perder una posición no es grave.
  }
}

/** Posición guardada de la entrada actual del historial, si la hay. */
export const storedScroll = (): number | undefined => {
  const y = (window.history.state as ScrollState)?.scrollY;
  return typeof y === 'number' ? y : undefined;
};

/**
 * Vuelve a la posición `y`. La página puede tardar un poco en tener su altura completa (datos que
 * llegan de la API, imágenes), así que lo reintenta durante un momento hasta conseguirlo.
 * Si la persona hace scroll mientras tanto, se deja de insistir.
 */
export function restoreScroll(y: number, timeoutMs = 2000) {
  const started = performance.now();
  let cancelled = false;
  const cancel = () => {
    cancelled = true;
  };
  window.addEventListener('wheel', cancel, { once: true, passive: true });
  window.addEventListener('touchstart', cancel, { once: true, passive: true });
  window.addEventListener('keydown', cancel, { once: true });

  const step = () => {
    if (cancelled) return;
    window.scrollTo({ top: y, left: 0, behavior: 'instant' });
    const reached = Math.abs(window.scrollY - y) < 2;
    if (!reached && performance.now() - started < timeoutMs) requestAnimationFrame(step);
    else {
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('keydown', cancel);
    }
  };
  requestAnimationFrame(step);
}

let pending: ReturnType<typeof setTimeout> | undefined;

/** Al cambiar de entrada del historial se descarta un guardado pendiente: era de la página anterior. */
export function forgetPendingScroll() {
  clearTimeout(pending);
}

/** Va guardando la posición mientras se hace scroll (al parar), por si se sale de la web. */
export function trackScroll(): () => void {
  const onScroll = () => {
    clearTimeout(pending);
    pending = setTimeout(rememberScroll, 200);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('pagehide', rememberScroll);
  return () => {
    clearTimeout(pending);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pagehide', rememberScroll);
  };
}
