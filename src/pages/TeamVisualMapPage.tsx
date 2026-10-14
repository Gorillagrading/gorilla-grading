import React, { useState, useEffect } from 'react';

interface TeamVisualMapPageProps {
  onNavigate?: (path: string) => void;
}

interface MapItem {
  id: string;
  name: string;
  cat: 'home' | 'pages' | 'pillars' | 'orphans';
  type: string;
  desc: string;
  warning?: string;
  image: string;
}

interface UserSubmission {
  user: string;
  updatedAt: string;
  votes: Record<string, 'keep' | 'remove' | 'replace' | 'merge'>;
  notes: Record<string, string>;
}

const ROOM_ENDPOINT = 'https://api.restful-api.dev/objects/ff808181a09d98f701a1353cd5665476';

const ITEMS: MapItem[] = [
  // HOME (12)
  {
    id: 'sec-1',
    name: '01. Hero + Slab Inspector 3D',
    cat: 'home',
    type: 'Sección Home #01',
    desc: 'Cabecera principal con titular ("Precision Gives Value"), botones de acción directa y el Slab 3D interactivo que rota con el cursor.',
    image: '/capturas/sec-1.png'
  },
  {
    id: 'sec-2',
    name: '02. Trusted by Collectors (Logos TCG)',
    cat: 'home',
    type: 'Sección Home #02',
    desc: 'Cinta horizontal deslizante con los 15 logos de juegos de cartas coleccionables (Pokémon, Magic, Yu-Gi-Oh!, One Piece, etc.).',
    image: '/capturas/sec-2.png'
  },
  {
    id: 'sec-3',
    name: '03. Tecnología en 4 Pasos (Resumen)',
    cat: 'home',
    type: 'Sección Home #03',
    desc: '4 columnas interactivas: 1. Escaneo Óptico, 2. Análisis Forense, 3. Medición Sub-Micrométrica, 4. Grado & Encapsulado.',
    image: '/capturas/sec-3.png'
  },
  {
    id: 'sec-4',
    name: '04. Verificación de Certificado',
    cat: 'home',
    type: 'Sección Home #04',
    warning: '⚠️ Repite la página /verify',
    desc: 'Buscador de certificados con previsualización forense. ¿Dejarlo aquí en la Home o basta con el del menú y la página dedicada /verify?',
    image: '/capturas/sec-4.png'
  },
  {
    id: 'sec-5',
    name: '05. Tarifas y Precios (Completa)',
    cat: 'home',
    type: 'Sección Home #05',
    warning: '⚠️ Idéntica a la página /pricing',
    desc: 'La matriz completa de precios (Standard 19€, Premium 25€, Express 50€, Event 15€). ¿Reducirla en la home a un resumen ligero con enlace?',
    image: '/capturas/sec-5.png'
  },
  {
    id: 'sec-6',
    name: '06. Proceso de Envío / Lab Process',
    cat: 'home',
    type: 'Sección Home #06',
    warning: '⚠️ Repite contenido de /technology',
    desc: 'Diagrama del paso a paso físico del envío de la carta. Al estar cerca de la sección #3, se siente repetitivo.',
    image: '/capturas/sec-6.png'
  },
  {
    id: 'sec-7',
    name: '07. Auditorías y Testimonios',
    cat: 'home',
    type: 'Sección Home #07',
    warning: '⚠️ Textos genéricos sin fotos',
    desc: 'Citas y reseñas de auditores. Actualmente tiene placeholders. ¿Quitar hasta recopilar reseñas reales con fotos de coleccionistas?',
    image: '/capturas/sec-7.png'
  },
  {
    id: 'sec-8',
    name: '08. Promo CTA (Entrega en Mano)',
    cat: 'home',
    type: 'Sección Home #08',
    desc: 'Banner oscuro que anuncia los puntos de recogida presencial en mano y redirige a /faq/dropoff.',
    image: '/capturas/sec-8.png'
  },
  {
    id: 'sec-9',
    name: '09. FAQ Rápida (3 Preguntas)',
    cat: 'home',
    type: 'Sección Home #09',
    warning: '⚠️ Resumen de /faq',
    desc: 'Acordeón con las 3 dudas más comunes y botón hacia el centro de ayuda completo /faq.',
    image: '/capturas/sec-9.png'
  },
  {
    id: 'sec-10',
    name: '10. Live Lab Reels (Redes Sociales)',
    cat: 'home',
    type: 'Sección Home #10',
    warning: '⚠️ Mockups sin vídeo real',
    desc: 'Módulo que simula vídeos verticales de TikTok e Instagram. ¿Conectar feed real o quitar mientras no haya vídeos grabados?',
    image: '/capturas/sec-10.png'
  },
  {
    id: 'sec-11',
    name: '11. Misión y Custodia Asegurada',
    cat: 'home',
    type: 'Sección Home #11',
    warning: '⚠️ Repite /about',
    desc: 'Banner con la promesa de seguridad, custodia asegurada y seriedad del laboratorio.',
    image: '/capturas/sec-11.png'
  },
  {
    id: 'sec-12',
    name: '12. Newsletter VIP',
    cat: 'home',
    type: 'Sección Home #12',
    desc: 'Cajón de captación de emails para novedades y aperturas de slots de graduación antes del footer.',
    image: '/capturas/sec-12.png'
  },

  // PÁGINAS PRINCIPALES (5)
  {
    id: 'pg-tech',
    name: '/technology — Tecnología',
    cat: 'pages',
    type: 'Página del Menú',
    desc: 'Página técnica sobre el instrumental óptico, las cámaras microscópicas y los 4 pilares.',
    image: '/capturas/pg-tech.png'
  },
  {
    id: 'pg-about',
    name: '/about — El Laboratorio',
    cat: 'pages',
    type: 'Página del Menú',
    desc: 'Historia, fundadores, filosofía y estándares de custodia del laboratorio Gorilla Grading.',
    image: '/capturas/pg-about.png'
  },
  {
    id: 'pg-verify',
    name: '/verify — Verificar Certificado',
    cat: 'pages',
    type: 'Página del Menú',
    desc: 'Buscador dedicado de números de serie y visualizador forense de defectos en esquinas y bordes.',
    image: '/capturas/pg-verify.png'
  },
  {
    id: 'pg-pricing',
    name: '/pricing — Tarifas',
    cat: 'pages',
    type: 'Página del Menú',
    desc: 'Página completa de tarifas, desglose de suplementos por valor asegurado y tiempos de entrega.',
    image: '/capturas/pg-pricing.png'
  },
  {
    id: 'pg-track',
    name: '/track — Estado del Pedido',
    cat: 'pages',
    type: 'Página del Menú',
    desc: 'Línea de tiempo para que los clientes rastreen en qué fase exacta está su pedido.',
    image: '/capturas/pg-track.png'
  },

  // 4 PILARES (4)
  {
    id: 'pil-pres',
    name: '/preserve — Preservar',
    cat: 'pillars',
    type: 'Pilar Científico 1',
    desc: 'Detalla el sellado ultrasónico hermético y polímeros con filtro contra rayos ultravioleta.',
    image: '/capturas/pil-pres.png'
  },
  {
    id: 'pil-auth',
    name: '/authenticate — Autenticar',
    cat: 'pillars',
    type: 'Pilar Científico 2',
    desc: 'Detección forense de falsificaciones: tramas roseta, grosor y microscopía espectral.',
    image: '/capturas/pil-auth.png'
  },
  {
    id: 'pil-und',
    name: '/understand — Comprender',
    cat: 'pillars',
    type: 'Pilar Científico 3',
    desc: 'Métricas objetivas y transparentes en micras que justifican el cálculo de cada nota.',
    image: '/capturas/pil-und.png'
  },
  {
    id: 'pil-bel',
    name: '/belong — Pertenecer',
    cat: 'pillars',
    type: 'Pilar Científico 4',
    desc: 'Comunidad exclusiva y registro digital de cartas certificadas por Gorilla Grading.',
    image: '/capturas/pil-bel.png'
  },

  // HUÉRFANAS Y DUDAS (4)
  {
    id: 'orph-hiw',
    name: '/how-it-works — Cómo Funciona',
    cat: 'orphans',
    type: '⚠️ Huérfana',
    warning: 'Apenas enlazada',
    desc: 'Solo se llega desde un botón secundario del banner PromoCTA. Repite lo que ya explica la Home.',
    image: '/capturas/orph-hiw.png'
  },
  {
    id: 'orph-serv',
    name: '/services — Servicios',
    cat: 'orphans',
    type: '⚠️ Huérfana',
    warning: 'Sin tráfico',
    desc: 'Solo enlazada desde /how-it-works. Toda esta información ya está cubierta en /pricing.',
    image: '/capturas/orph-serv.png'
  },
  {
    id: 'orph-conc',
    name: '/concepts — Comparativa Interna',
    cat: 'orphans',
    type: '⚠️ Resto de prototipo',
    warning: 'Prototipo viejo',
    desc: 'Página de pruebas de desarrollo que compara 3 conceptos antiguos. Ningún enlace público apunta a ella.',
    image: '/capturas/orph-conc.png'
  },
  {
    id: 'flow-sub',
    name: '/submit — Wizard de Envío de Cartas',
    cat: 'orphans',
    type: 'Flujo de Compra',
    desc: 'El formulario guiado paso a paso donde el cliente configura sus cartas, escoge el seguro y paga.',
    image: '/capturas/flow-sub.png'
  }
];

export const TeamVisualMapPage: React.FC<TeamVisualMapPageProps> = () => {
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('gorilla_voter_name') || '';
  });

  const [votes, setVotes] = useState<Record<string, 'keep' | 'remove' | 'replace' | 'merge'>>(() => {
    try {
      return JSON.parse(localStorage.getItem('gorilla_online_votes') || '{}');
    } catch {
      return {};
    }
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('gorilla_online_notes') || '{}');
    } catch {
      return {};
    }
  });

  const [submissions, setSubmissions] = useState<Record<string, UserSubmission>>({});
  const [viewTab, setViewTab] = useState<'vote' | 'results'>('vote');
  const [activeFilter, setActiveFilter] = useState<'all' | 'home' | 'pages' | 'pillars' | 'orphans'>('all');
  const [lightboxImg, setLightboxImg] = useState<{ src: string; title: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // FETCH CLOUD VOTES ON MOUNT
  const fetchCloudSubmissions = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch(ROOM_ENDPOINT);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.submissions) {
          setSubmissions(json.data.submissions);
        }
      }
    } catch (err) {
      console.warn('Error fetching cloud votes:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchCloudSubmissions();
  }, []);

  const handleVote = (id: string, decision: 'keep' | 'remove' | 'replace' | 'merge') => {
    const updated = { ...votes };
    if (updated[id] === decision) {
      delete updated[id];
    } else {
      updated[id] = decision;
    }
    setVotes(updated);
    localStorage.setItem('gorilla_online_votes', JSON.stringify(updated));
  };

  const handleNoteChange = (id: string, text: string) => {
    const updated = { ...notes, [id]: text };
    setNotes(updated);
    localStorage.setItem('gorilla_online_notes', JSON.stringify(updated));
  };

  const handleSaveName = (name: string) => {
    setUserName(name);
    localStorage.setItem('gorilla_voter_name', name);
  };

  // SEND MY VOTES TO THE CLOUD
  const handleSaveToCloud = async () => {
    const cleanName = userName.trim();
    if (!cleanName) {
      alert('Por favor escribe tu nombre arriba antes de enviar tus votos.');
      return;
    }

    const totalVotedCount = Object.keys(votes).length;
    if (totalVotedCount === 0) {
      alert('Aún no has votado ninguna sección. Marca tus votos antes de enviar.');
      return;
    }

    try {
      setIsSyncing(true);
      // 1. Fetch current object to avoid overwriting peers
      const getRes = await fetch(ROOM_ENDPOINT);
      let currentData = { submissions: {} };
      if (getRes.ok) {
        const json = await getRes.json();
        if (json.data) currentData = json.data;
      }

      // 2. Attach my submission
      const newSubmission: UserSubmission = {
        user: cleanName,
        updatedAt: new Date().toISOString(),
        votes,
        notes
      };

      const updatedSubmissions = {
        ...(currentData.submissions || {}),
        [cleanName]: newSubmission
      };

      // 3. PUT back
      const putRes = await fetch(ROOM_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'GORILLA_GRADING_LIVE_VOTES_ROOM',
          data: {
            submissions: updatedSubmissions
          }
        })
      });

      if (putRes.ok) {
        setSubmissions(updatedSubmissions);
        showToast(`✅ ¡Tus votos (${cleanName}) han quedado guardados en la nube!`);
      } else {
        throw new Error('Error al guardar en el servidor');
      }
    } catch (err: any) {
      alert('Error de conexión al guardar: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // TALLY CALCULATOR FOR RESULTS MODE
  const submissionList = Object.values(submissions);
  const totalParticipants = submissionList.length;

  const calculateTally = (itemId: string) => {
    let keep = 0, remove = 0, replace = 0, merge = 0;
    const comments: { user: string; text: string; choice?: string }[] = [];

    submissionList.forEach((sub) => {
      const choice = sub.votes[itemId];
      if (choice === 'keep') keep++;
      else if (choice === 'remove') remove++;
      else if (choice === 'replace') replace++;
      else if (choice === 'merge') merge++;

      if (sub.notes && sub.notes[itemId]) {
        comments.push({
          user: sub.user,
          text: sub.notes[itemId],
          choice
        });
      }
    });

    const total = keep + remove + replace + merge;
    return { keep, remove, replace, merge, total, comments };
  };

  const filteredItems = ITEMS.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.cat === activeFilter;
  });

  return (
    <div className="w-full min-h-screen bg-[#070908] text-[#F3F4F6] font-sans pb-28 selection:bg-[#22C55E] selection:text-[#052E16]">
      {/* STICKY TOP HEADER */}
      <header className="sticky top-0 z-50 bg-[#070908]/95 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* LOGO & TITLE */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#15803D] to-[#052E16] border border-[#22C55E] flex items-center justify-center text-xl shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              🦍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-tight">GORILLA GRADING</h1>
                <span className="text-xs font-mono font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/30 px-2 py-0.5 rounded">
                  VOTACIÓN EN LA NUBE
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF]">
                Enlace secreto del equipo: <code className="text-[#22C55E]">/mapa</code>
              </p>
            </div>
          </div>

          {/* USER NAME & MODE TOGGLES */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* VIEW MODE TOGGLE */}
            <div className="bg-[#111412] p-1 rounded-xl border border-white/10 flex items-center gap-1">
              <button
                onClick={() => setViewTab('vote')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  viewTab === 'vote' ? 'bg-[#22C55E] text-[#052E16]' : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                ✍️ Mi Voto
              </button>
              <button
                onClick={() => {
                  fetchCloudSubmissions();
                  setViewTab('results');
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  viewTab === 'results' ? 'bg-[#3B82F6] text-white' : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                <span>📊 Ver Resultados del Equipo</span>
                {totalParticipants > 0 && (
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                    {totalParticipants}
                  </span>
                )}
              </button>
            </div>

            {/* SYNC REFRESH BUTTON */}
            <button
              onClick={fetchCloudSubmissions}
              disabled={isSyncing}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[#9CA3AF] hover:text-white hover:bg-white/10 transition"
              title="Actualizar votos de la nube"
            >
              {isSyncing ? '🔄 Sincronizando...' : '🔄 Actualizar'}
            </button>
          </div>

        </div>
      </header>

      {/* VOTER STRIP / CLOUD ACTIONS */}
      {viewTab === 'vote' ? (
        <div className="bg-[#111412] border-b border-white/10 px-6 py-3">
          <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
            
            {/* USER NAME INPUT */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Tu Nombre:</span>
              <input
                type="text"
                placeholder="Ej. Carlos, Laura, Jesús..."
                value={userName}
                onChange={(e) => handleSaveName(e.target.value)}
                className="bg-[#080A09] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#22C55E] w-48 font-semibold"
              />
            </div>

            {/* SAVE TO CLOUD BUTTON */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#9CA3AF]">
                Has votado <strong className="text-white">{Object.keys(votes).length}</strong> de {ITEMS.length}
              </span>
              <button
                onClick={handleSaveToCloud}
                disabled={isSyncing}
                className="text-xs font-bold px-5 py-2 rounded-lg bg-[#22C55E] text-[#052E16] hover:bg-[#4ADE80] transition shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center gap-2"
              >
                <span>🚀</span>
                <span>{isSyncing ? 'Guardando en la nube...' : 'GUARDAR MIS VOTOS EN LA NUBE'}</span>
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* RESULTS OVERVIEW STRIP */
        <div className="bg-[#111412] border-b border-white/10 px-6 py-3">
          <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#38BDF8]">
                📊 Resultados de {totalParticipants} miembros del equipo:
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {submissionList.map((s) => (
                  <span
                    key={s.user}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15"
                  >
                    👤 {s.user}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setViewTab('vote')}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
            >
              ← Volver a votar
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-[1600px] mx-auto px-6 pt-6">

        {/* CATEGORY FILTER TABS */}
        <div className="flex gap-2 flex-wrap bg-[#111412] p-1.5 rounded-xl border border-white/5 mb-8">
          {[
            { id: 'all', label: `Todos (${ITEMS.length})` },
            { id: 'home', label: '🏠 Solo la Home (12 secciones)' },
            { id: 'pages', label: '📑 Páginas del Menú (5)' },
            { id: 'pillars', label: '🏛️ Los 4 Pilares (4)' },
            { id: 'orphans', label: '⚠️ Huérfanas y Dudas (4)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
                activeFilter === tab.id
                  ? 'bg-[#22C55E] text-[#052E16] font-bold'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => {
            const currentVote = votes[item.id];
            const tally = calculateTally(item.id);

            return (
              <div
                key={item.id}
                className="bg-[#111412] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-lg hover:border-white/20 transition"
              >
                {/* CARD HEAD */}
                <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-3 bg-white/[0.01]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center font-mono font-bold text-xs text-[#22C55E]">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{item.name}</h3>
                      <span className="text-[11px] font-mono text-[#6B7280]">{item.type}</span>
                    </div>
                  </div>
                  {item.warning && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 whitespace-nowrap">
                      {item.warning}
                    </span>
                  )}
                </div>

                {/* REAL SCREENSHOT WITH LIGHTBOX ZOOM */}
                <div
                  className="relative bg-black h-52 cursor-zoom-in overflow-hidden group border-b border-white/5"
                  onClick={() => setLightboxImg({ src: item.image, title: item.name })}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-black/80 border border-white/20 text-white backdrop-blur">
                      🔍 Ver imagen completa
                    </span>
                  </div>
                </div>

                {/* CARD BODY */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">{item.desc}</p>

                  {/* MODE 1: VOTING CONTROLS */}
                  {viewTab === 'vote' ? (
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col gap-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                        Tu Voto:
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          onClick={() => handleVote(item.id, 'keep')}
                          className={`py-2 px-1 rounded-lg text-[11px] font-bold border transition flex flex-col items-center gap-0.5 ${
                            currentVote === 'keep'
                              ? 'bg-[#10B981] text-[#052E16] border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                              : 'bg-white/5 border-white/10 text-[#9CA3AF] hover:text-white hover:border-white/20'
                          }`}
                        >
                          <span>✅</span>
                          <span>DEJAR</span>
                        </button>

                        <button
                          onClick={() => handleVote(item.id, 'remove')}
                          className={`py-2 px-1 rounded-lg text-[11px] font-bold border transition flex flex-col items-center gap-0.5 ${
                            currentVote === 'remove'
                              ? 'bg-[#EF4444] text-white border-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                              : 'bg-white/5 border-white/10 text-[#9CA3AF] hover:text-white hover:border-white/20'
                          }`}
                        >
                          <span>❌</span>
                          <span>QUITAR</span>
                        </button>

                        <button
                          onClick={() => handleVote(item.id, 'replace')}
                          className={`py-2 px-1 rounded-lg text-[11px] font-bold border transition flex flex-col items-center gap-0.5 ${
                            currentVote === 'replace'
                              ? 'bg-[#F59E0B] text-[#451A03] border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                              : 'bg-white/5 border-white/10 text-[#9CA3AF] hover:text-white hover:border-white/20'
                          }`}
                        >
                          <span>🔄</span>
                          <span>CAMBIAR</span>
                        </button>

                        <button
                          onClick={() => handleVote(item.id, 'merge')}
                          className={`py-2 px-1 rounded-lg text-[11px] font-bold border transition flex flex-col items-center gap-0.5 ${
                            currentVote === 'merge'
                              ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                              : 'bg-white/5 border-white/10 text-[#9CA3AF] hover:text-white hover:border-white/20'
                          }`}
                        >
                          <span>🔗</span>
                          <span>UNIR</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Comentario sobre esta sección..."
                        value={notes[item.id] || ''}
                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                        className="w-full bg-[#080A09] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-[#6B7280] focus:outline-none focus:border-[#22C55E]"
                      />
                    </div>
                  ) : (
                    /* MODE 2: TEAM LIVE RESULTS DISPLAY */
                    <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/10 pb-2">
                        <span>📊 Votos del Equipo ({tally.total}):</span>
                        {tally.total === 0 && <span className="text-[#6B7280]">Sin votos</span>}
                      </div>

                      {/* TALLY BARS */}
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg p-1.5">
                          <span className="text-[10px] text-[#10B981] font-bold block">DEJAR</span>
                          <span className="font-bold text-white text-sm">{tally.keep}</span>
                        </div>
                        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg p-1.5">
                          <span className="text-[10px] text-[#EF4444] font-bold block">QUITAR</span>
                          <span className="font-bold text-white text-sm">{tally.remove}</span>
                        </div>
                        <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg p-1.5">
                          <span className="text-[10px] text-[#F59E0B] font-bold block">CAMBIAR</span>
                          <span className="font-bold text-white text-sm">{tally.replace}</span>
                        </div>
                        <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-lg p-1.5">
                          <span className="text-[10px] text-[#3B82F6] font-bold block">UNIR</span>
                          <span className="font-bold text-white text-sm">{tally.merge}</span>
                        </div>
                      </div>

                      {/* TEAM COMMENTS STREAM */}
                      <div className="mt-1 flex flex-col gap-1.5">
                        <span className="text-[11px] font-bold text-[#9CA3AF]">Comentarios del equipo:</span>
                        {tally.comments.length > 0 ? (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {tally.comments.map((c, i) => (
                              <div
                                key={i}
                                className="bg-white/5 border border-white/10 rounded-lg p-2 text-xs flex flex-col gap-0.5"
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <strong className="text-white">{c.user}</strong>
                                  <span className="text-[#22C55E] uppercase font-bold text-[10px]">
                                    {c.choice === 'keep'
                                      ? '✅ Dejar'
                                      : c.choice === 'remove'
                                      ? '❌ Quitar'
                                      : c.choice === 'replace'
                                      ? '🔄 Cambiar'
                                      : c.choice === 'merge'
                                      ? '🔗 Unir'
                                      : ''}
                                  </span>
                                </div>
                                <p className="text-[#D1D5DB] text-[11px] italic">"{c.text}"</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#6B7280] italic">Nadie ha dejado comentarios aún.</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* FULLSCREEN LIGHTBOX */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxImg(null)}
        >
          <div className="w-full max-w-5xl flex items-center justify-between mb-3" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-white font-bold text-base">{lightboxImg.title}</h4>
            <button
              onClick={() => setLightboxImg(null)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-[#EF4444] text-white transition"
            >
              Cerrar ✕
            </button>
          </div>
          <div
            className="w-full max-w-5xl max-h-[85vh] overflow-auto rounded-xl border border-white/20 bg-[#0B0E0B] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={lightboxImg.src} alt={lightboxImg.title} className="w-full h-auto block" />
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#10B981] text-[#052E16] font-bold text-xs px-4 py-3 rounded-xl shadow-2xl animate-fade-in flex items-center gap-2">
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
