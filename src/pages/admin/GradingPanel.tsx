import React, { useRef, useState } from 'react';
import { Camera, Check, CheckCircle2, FileUp, Trash2, X } from 'lucide-react';
import type { AdminOrderDetail } from '../../../shared/admin';
import type { AdminGradingResult, GradingBody } from '../../../shared/grading-admin';
import { GRADE_LABELS, traceGrade } from '../../../shared/grading';
import type { ImageDto } from '../../../shared/photos';
import type { IdentifyCardBody } from '../../../shared/admin';
import { cardTitle } from '../../../shared/cards';
import {
  adminErrorMessage, approveGrading, deleteItemImage, identifyCard, importScanReport, rejectGrading, saveGrading, uploadItemImage,
} from '../../api/admin';
import { MAX_SCAN_PDF_BYTES } from '../../../shared/grading-admin';
import { useAuth } from '../../context/AuthContext';
import { usePanelTheme } from './ui';

type Item = AdminOrderDetail['items'][number];
type Defect = AdminGradingResult['defects'][number];

/** Mientras el pedido está en el laboratorio y no en pausa se puede graduar (igual que en el servidor). */
const GRADABLE = ['PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE'];
const SCALE = Array.from({ length: 19 }, (_, i) => 10 - i * 0.5);
const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 1 });

const CATEGORY_TEXT = { centering: 'Centrado', corners: 'Esquinas', edges: 'Bordes', surface: 'Superficie' } as const;
const SEVERITY_TEXT = { flawless: 'Sin defecto', minor: 'Leve', moderate: 'Moderado', critical: 'Grave' } as const;
const KIND_TEXT = { front: 'Anverso', back: 'Reverso', extra: 'Extra' } as const;

type Scores = { centering: string; corners: string; edges: string; surface: string };

export const GradingPanel: React.FC<{
  code: string;
  order: AdminOrderDetail;
  item: Item;
  images: ImageDto[];
  onChanged: () => Promise<void>;
  onMessage: (kind: 'notice' | 'error', text: string) => void;
}> = ({ code, order, item, images, onChanged, onMessage }) => {
  const t = usePanelTheme();
  const { user } = useAuth();
  const role = user?.role ?? 'customer';
  const isAdmin = role === 'admin';
  const grading = item.grading;
  const gradable = GRADABLE.includes(order.order.status);
  const isLab = ['staff', 'grader', 'qa', 'admin'].includes(role);
  const confirmed = grading?.status === 'approved';
  // Un resultado confirmado solo lo cambia un administrador (con un PDF nuevo o a mano).
  const canLoad = gradable && isLab && (!confirmed || isAdmin);
  const kinds = new Set(images.map((img) => img.kind));
  // Una carta no auténtica no se encapsula: no necesita fotos del slab.
  const needsPhotos = !grading || grading.isAuthentic;
  const hasPhotos = kinds.has('front') && kinds.has('back');
  const hasPdf = !!grading && grading.status !== 'draft';
  const canConfirm = gradable && isLab && grading?.status === 'pending_qa';
  const missingForConfirm = [
    !hasPdf && 'el PDF del escáner',
    needsPhotos && !hasPhotos && 'las fotos del slab (anverso y reverso)',
    hasPdf && !item.cardName && 'el nombre de la carta (pídelo a un administrador)',
  ].filter(Boolean) as string[];

  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  /** El resultado de la última acción, junto a la carta: el aviso general de la página queda lejos de donde se trabaja. */
  const [local, setLocal] = useState<{ kind: 'notice' | 'error'; text: string } | null>(null);

  const run = async (work: () => Promise<unknown>, done: string) => {
    setBusy(true);
    setLocal(null);
    try {
      await work();
      await onChanged();
      onMessage('notice', done);
      setLocal({ kind: 'notice', text: done });
      return true;
    } catch (err) {
      onMessage('error', adminErrorMessage(err));
      setLocal({ kind: 'error', text: adminErrorMessage(err) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const state = confirmed
    ? { text: 'Confirmada', tone: 'text-[#25762F] bg-[#EAF4EC]' }
    : grading?.status === 'pending_qa'
      ? { text: hasPhotos || !needsPhotos ? 'Lista para confirmar' : 'Faltan fotos del slab', tone: 'text-[#A86A12] bg-[#FBF1DD]' }
      : { text: 'Falta el PDF', tone: 'text-[#666A67] bg-[#F1F1EE]' };

  return (
    <details className={`border rounded-[8px] ${t.rule}`} open={!confirmed && gradable}>
      <summary className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 cursor-pointer select-none">
        <span className={`font-mono text-xs ${t.muted}`}>{String(item.position).padStart(2, '0')}</span>
        <span className={`font-bold text-sm ${t.text}`}>{cardTitle(item.cardName, item.position)}</span>
        <span className="flex-1" />
        {grading?.finalGrade != null && grading.status !== 'draft' && (
          <span className={`text-sm font-bold ${t.text}`}>{fmt(grading.finalGrade)}</span>
        )}
        {grading && !grading.isAuthentic && <span className={`text-xs font-bold ${t.negative}`}>No auténtica</span>}
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${state.tone}`}>{state.text}</span>
      </summary>

      <div className={`border-t px-4 py-4 space-y-4 ${t.rule}`}>
        {local && (
          <p role={local.kind === 'error' ? 'alert' : 'status'} className={`text-xs font-bold ${local.kind === 'error' ? 'text-red-500' : t.positive}`}>
            {local.text}
          </p>
        )}

        {!gradable && order.order.status === 'SUBMITTED' && (
          <p className={`text-xs font-bold ${t.isLight ? 'text-amber-700' : 'text-amber-300'}`}>
            Confirma primero la recepción del paquete. Después podrás subir el PDF del escáner y las fotos del slab.
          </p>
        )}

        {/* Paso 1: el PDF del escáner */}
        <Step n={1} done={hasPdf} title="Informe del escáner (PDF)">
          {hasPdf && grading && <ResultView grading={grading} />}
          {canLoad && (
            <ScannerImport
              busy={busy}
              replaces={hasPdf}
              onFile={(file) => run(() => importScanReport(code, item.position, file), 'PDF leído. Revisa el resultado y confírmalo.')}
            />
          )}
        </Step>

        {/* Paso 2: las fotos de la carta ya encapsulada */}
        <Step n={2} done={hasPhotos || !needsPhotos} title={needsPhotos ? 'Fotos del slab (anverso y reverso)' : 'Fotos del slab (no hacen falta: la carta no es auténtica)'}>
          <Photos code={code} position={item.position} images={images} canPhoto={isLab && (!confirmed || isAdmin)} busy={busy} run={run} />
        </Step>

        {/* Paso 3: confirmar */}
        <Step n={3} done={confirmed} title="Confirmar el resultado">
          {confirmed ? (
            <p className={`text-xs ${t.muted}`}>
              Confirmado{grading?.qaApprovedBy ? ` por ${grading.qaApprovedBy}` : ''}. Se emitirá el certificado al aprobar la salida del pedido.
            </p>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                disabled={busy || !canConfirm || missingForConfirm.length > 0}
                onClick={() => void run(() => approveGrading(code, item.position), 'Carta confirmada.')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t.primary}`}
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Confirmar carta
              </button>
              {missingForConfirm.length > 0 ? (
                <p className={`text-[11px] ${t.muted}`}>Para confirmar falta: {missingForConfirm.join(' y ')}.</p>
              ) : (
                <p className={`text-[11px] ${t.muted}`}>Comprueba que lo leído coincide con el PDF. Al confirmar, el resultado queda fijado.</p>
              )}
            </div>
          )}
        </Step>

        {/* Solo administración: corregir los datos de la carta o el resultado a mano */}
        {isAdmin && (gradable || order.order.status === 'ON_HOLD') && (
          <details className={`border-t pt-3 ${t.rule}`}>
            <summary className={`text-[12px] font-semibold cursor-pointer ${t.muted}`}>Correcciones de administrador</summary>
            <div className="mt-3 space-y-4">
              <Identification
                item={item}
                canEdit
                busy={busy}
                onSave={(body) => run(() => identifyCard(code, item.position, body), 'Datos de la carta guardados.')}
              />
              {grading?.status === 'pending_qa' && (
                <RejectAction busy={busy} onReject={(reason) => run(() => rejectGrading(code, item.position, reason), 'Resultado anulado. Hay que volver a subir el PDF.')} />
              )}
              {!editing ? (
                <button type="button" onClick={() => setEditing(true)} className={`px-4 py-2.5 border rounded-[8px] text-xs font-bold cursor-pointer ${t.secondary}`}>
                  {grading ? 'Corregir el resultado a mano (nueva versión)' : 'Introducir el resultado a mano'}
                </button>
              ) : (
                <GradingForm
                  key={`${grading?.version ?? 0}-${grading?.status ?? 'none'}`}
                  initial={grading}
                  busy={busy}
                  images={images}
                  onCancel={() => setEditing(false)}
                  onSave={async (body) => {
                    const ok = await run(() => saveGrading(code, item.position, body), body.submit ? 'Resultado guardado. Falta confirmarlo.' : 'Borrador guardado.');
                    if (ok) setEditing(false);
                  }}
                />
              )}
            </div>
          </details>
        )}
      </div>
    </details>
  );
};

/** Un paso del trabajo con una carta: número (o marca de hecho), título y contenido. */
const Step: React.FC<{ n: number; done: boolean; title: string; children: React.ReactNode }> = ({ n, done, title, children }) => {
  const t = usePanelTheme();
  return (
    <section className="grid grid-cols-[24px_minmax(0,1fr)] gap-x-3">
      <span
        className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] font-semibold ${done ? 'bg-[#2F8F3E] text-white' : 'border border-[#C9CBC7] text-[#666A67]'}`}
        aria-hidden="true"
      >
        {done ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : n}
      </span>
      <div className="min-w-0 space-y-2">
        <h4 className={`text-[13px] font-semibold leading-6 ${t.text}`}>
          {title}
          <span className="sr-only">{done ? ' (hecho)' : ' (pendiente)'}</span>
        </h4>
        {children}
      </div>
    </section>
  );
};

/** Administración puede anular un resultado sin confirmar (por ejemplo, si se subió el PDF de otra carta). */
const RejectAction: React.FC<{ busy: boolean; onReject: (reason: string) => void }> = ({ busy, onReject }) => {
  const t = usePanelTheme();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`px-4 py-2.5 border rounded-[8px] text-xs font-bold cursor-pointer ${t.secondary}`}>
        Anular el resultado sin confirmar
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <textarea
        aria-label="Motivo"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Motivo (queda registrado)"
        className={`w-full px-3 py-2 text-sm border rounded-[8px] focus:outline-none ${t.input}`}
      />
      <div className="flex gap-2">
        <button type="button" disabled={busy || !reason.trim()} onClick={() => onReject(reason.trim())} className={`px-4 py-2 rounded-[8px] text-xs font-semibold cursor-pointer disabled:opacity-50 ${t.primary}`}>
          Anular
        </button>
        <button type="button" onClick={() => setOpen(false)} className={`px-4 py-2 border rounded-[8px] text-xs font-bold cursor-pointer ${t.secondary}`}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Identificación de la carta
// ---------------------------------------------------------------------------

const GAMES = ['Pokémon', 'Magic: The Gathering', 'Yu-Gi-Oh!', 'One Piece', 'Disney Lorcana', 'Dragon Ball Super', 'Digimon', 'Panini'];
const LANGUAGES = ['Español', 'English', 'Japonés', 'Français', 'Deutsch', 'Italiano', 'Português', 'Coreano', 'Chino'];

/** Qué carta es: el cliente solo dice cuántas envía, así que la apunta el laboratorio al abrir el paquete. */
const Identification: React.FC<{
  item: Item;
  canEdit: boolean;
  busy: boolean;
  onSave: (body: IdentifyCardBody) => Promise<boolean>;
}> = ({ item, canEdit, busy, onSave }) => {
  const t = usePanelTheme();
  const identified = !!item.cardName;
  const [editing, setEditing] = useState(!identified);
  const [form, setForm] = useState({
    cardName: item.cardName ?? '',
    game: item.game ?? '',
    setName: item.setName ?? '',
    cardNumber: item.cardNumber ?? '',
    year: item.year ? String(item.year) : '',
    language: item.language ?? '',
  });
  const field = `w-full px-3 py-2.5 text-sm border rounded-[8px] focus:outline-none ${t.input}`;
  const label = `block text-[12px] mb-1 ${t.muted}`;
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });
  const year = Number(form.year);
  const valid = !!form.cardName.trim() && !!form.game.trim() && (!form.year || (Number.isInteger(year) && year >= 1800 && year <= 2100));

  if (!editing) {
    return (
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className={`text-[12px] ${t.muted}`}>Carta</div>
          <div className={`text-sm font-bold ${t.text}`}>{item.cardName}</div>
          <div className={`text-xs ${t.muted}`}>
            {[item.game, item.setName, item.cardNumber && `nº ${item.cardNumber}`, item.year, item.language].filter(Boolean).join(' · ')}
          </div>
        </div>
        {canEdit && (
          <button type="button" onClick={() => setEditing(true)} className={`px-3 py-2 border rounded-[8px] text-xs font-bold cursor-pointer ${t.secondary}`}>
            Corregir datos
          </button>
        )}
      </div>
    );
  }

  if (!canEdit) {
    return <p className={`text-xs ${t.muted}`}>La carta todavía no está identificada.</p>;
  }

  return (
    <form
      className={`border rounded-[8px] p-4 space-y-3 ${t.rule}`}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        const ok = await onSave({
          cardName: form.cardName.trim(),
          game: form.game.trim(),
          setName: form.setName.trim() || undefined,
          cardNumber: form.cardNumber.trim() || undefined,
          year: form.year ? year : undefined,
          language: form.language.trim() || undefined,
        });
        if (ok) setEditing(false);
      }}
    >
      <div>
        <h4 className={`text-sm font-bold ${t.text}`}>{identified ? 'Corregir los datos de la carta' : 'Identificar la carta'}</h4>
        <p className={`text-xs ${t.muted}`}>Es lo que saldrá en el certificado. Hace falta antes de enviarla a control de calidad.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block sm:col-span-2">
          <span className={label}>Nombre de la carta *</span>
          <input value={form.cardName} onChange={set('cardName')} maxLength={200} required placeholder="Ej. Charizard Holo" className={field} />
        </label>
        <label className="block">
          <span className={label}>Juego *</span>
          <input value={form.game} onChange={set('game')} maxLength={80} required list="gg-games" placeholder="Ej. Pokémon" className={field} />
          <datalist id="gg-games">{GAMES.map((g) => <option key={g} value={g} />)}</datalist>
        </label>
        <label className="block">
          <span className={label}>Set o expansión</span>
          <input value={form.setName} onChange={set('setName')} maxLength={200} placeholder="Ej. Base Set" className={field} />
        </label>
        <label className="block">
          <span className={label}>Número en el set</span>
          <input value={form.cardNumber} onChange={set('cardNumber')} maxLength={40} placeholder="Ej. 4/102" className={field} />
        </label>
        <label className="block">
          <span className={label}>Año</span>
          <input value={form.year} onChange={set('year')} inputMode="numeric" maxLength={4} placeholder="Ej. 1999" className={field} />
        </label>
        <label className="block sm:col-span-2">
          <span className={label}>Idioma</span>
          <input value={form.language} onChange={set('language')} maxLength={40} list="gg-languages" placeholder="Ej. English" className={field} />
          <datalist id="gg-languages">{LANGUAGES.map((l) => <option key={l} value={l} />)}</datalist>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy || !valid} className={`px-4 py-2.5 rounded-[8px] text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t.primary}`}>
          Guardar carta
        </button>
        {identified && (
          <button type="button" onClick={() => setEditing(false)} className={`px-4 py-2.5 text-xs font-bold cursor-pointer ${t.muted} hover:underline`}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Fotos
// ---------------------------------------------------------------------------

const Photos: React.FC<{
  code: string;
  position: number;
  images: ImageDto[];
  canPhoto: boolean;
  busy: boolean;
  run: (work: () => Promise<unknown>, done: string) => Promise<boolean>;
}> = ({ code, position, images, canPhoto, busy, run }) => {
  const t = usePanelTheme();
  const input = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<'front' | 'back'>('front');
  const latest = (k: 'front' | 'back') => images.find((img) => img.kind === k);

  return (
    <div className="space-y-2">
      <p className={`text-[11px] ${t.muted}`}>La carta ya encapsulada. Es la foto que se ve en el certificado público; las imágenes del escaneo salen del PDF.</p>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void run(() => uploadItemImage(code, position, kind, file), `Foto del ${KIND_TEXT[kind].toLowerCase()} subida.`);
        }}
      />
      <div className="flex flex-wrap gap-3">
        {(['front', 'back'] as const).map((k) => {
          const img = latest(k);
          return (
            <div key={k} className={`w-[calc(50%-6px)] max-w-[132px] border rounded-[8px] p-2 ${t.rule}`}>
              <div className={`text-[11px] font-semibold mb-1.5 ${t.text}`}>{KIND_TEXT[k]}</div>
              {img ? (
                <div className="relative">
                  <a href={img.url} target="_blank" rel="noreferrer">
                    <img src={img.url} alt={`Slab, ${KIND_TEXT[k].toLowerCase()}`} className="h-28 w-full rounded object-contain bg-[#F6F6F3]" />
                  </a>
                  {canPhoto && (
                    <button
                      type="button"
                      aria-label={`Borrar foto del ${KIND_TEXT[k].toLowerCase()}`}
                      disabled={busy}
                      onClick={() => window.confirm('¿Borrar esta foto?') && void run(() => deleteItemImage(code, position, img.id), 'Foto borrada.')}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-600 text-white cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : canPhoto ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setKind(k);
                    // Espera a que se guarde el lado elegido antes de abrir el selector de archivos.
                    setTimeout(() => input.current?.click(), 0);
                  }}
                  className={`w-full h-28 rounded border border-dashed inline-flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer disabled:opacity-50 ${t.rule} ${t.muted} hover:border-[#0F1110] hover:text-[#0F1110]`}
                >
                  <Camera className="w-4 h-4" aria-hidden="true" /> {busy ? 'Subiendo…' : 'Subir foto'}
                </button>
              ) : (
                <div className={`h-28 rounded bg-[#F6F6F3] flex items-center justify-center text-[11px] ${t.muted}`}>Sin foto</div>
              )}
            </div>
          );
        })}
      </div>
      {canPhoto && <p className={`text-[11px] ${t.muted}`}>JPEG, PNG o WebP · hasta 30 MB</p>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Resultado (solo lectura)
// ---------------------------------------------------------------------------

const ResultView: React.FC<{ grading: AdminGradingResult }> = ({ grading }) => {
  const t = usePanelTheme();
  const rows = [
    ['Centrado', grading.centering],
    ['Esquinas', grading.corners],
    ['Bordes', grading.edges],
    ['Superficie', grading.surface],
  ] as const;

  return (
    <div className="space-y-3">
      <h4 className={`text-[12px] ${t.muted}`}>
        {grading.rule === 'scanner' ? 'Leído del PDF' : 'Introducido a mano'} · versión {grading.version} · subió {grading.gradedBy}
      </h4>
      {!grading.isAuthentic ? (
        <p className={`text-sm font-bold ${t.negative}`}>No se ha podido autenticar la carta.</p>
      ) : (
        <>
          <p className={`text-lg font-bold ${t.text}`}>
            {grading.finalGrade !== null && fmt(grading.finalGrade)}
            {grading.certificateNumber && <span className={`ml-3 font-mono text-xs font-bold ${t.muted}`}>Certificado {grading.certificateNumber}</span>}
          </p>
          {grading.scan && <ScanSummary scan={grading.scan} />}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className={`text-[12px] ${t.muted}`}>{label}</dt>
                <dd className={`font-bold ${t.text}`}>{value ? fmt(value.score) : '—'}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {grading.defects.length > 0 && (
        <ul className="space-y-1 text-xs">
          {grading.defects.map((d, i) => (
            <li key={i} className={t.text}>
              <span className={`text-[12px] mr-2 ${t.muted}`}>{d.side === 'front' ? 'Anv.' : 'Rev.'} · {CATEGORY_TEXT[d.category]} · {SEVERITY_TEXT[d.severity]}</span>
              {d.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Informe del escáner
// ---------------------------------------------------------------------------

/** Sube el PDF que genera el programa del escáner: el servidor lee todo lo que dice y lo deja para control de calidad. */
const ScannerImport: React.FC<{ busy: boolean; replaces: boolean; onFile: (file: File) => Promise<boolean> }> = ({ busy, replaces, onFile }) => {
  const t = usePanelTheme();
  const input = useRef<HTMLInputElement>(null);
  const [tooBig, setTooBig] = useState(false);

  return (
    <div className="space-y-2">
      {!replaces && (
        <p className={`text-xs ${t.muted}`}>
          Se leen del PDF la carta, las notas, las medidas, las esquinas, los daños y el número de certificado. No hay que escribir nada a mano.
        </p>
      )}
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setTooBig(file.size > MAX_SCAN_PDF_BYTES);
          if (file.size <= MAX_SCAN_PDF_BYTES) void onFile(file);
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className={`inline-flex items-center gap-2 rounded-[8px] text-xs font-semibold cursor-pointer disabled:opacity-50 ${replaces ? `px-3 py-2 border ${t.secondary}` : `px-4 py-2.5 ${t.primary}`}`}
        title={replaces ? 'Un PDF nuevo sustituye al actual' : undefined}
      >
        <FileUp className="w-4 h-4" /> {busy ? 'Leyendo el PDF…' : replaces ? 'Subir otro PDF' : 'Subir el PDF del escáner'}
      </button>
      {tooBig && <p role="alert" className="text-xs font-bold text-red-500">El PDF pesa más de 4 MB.</p>}
    </div>
  );
};

/** Lo que se leyó del informe, para que control de calidad lo compare con el PDF. */
const ScanSummary: React.FC<{ scan: NonNullable<AdminGradingResult['scan']> }> = ({ scan }) => {
  const t = usePanelTheme();
  const corner = { topLeft: 'Sup. izq.', topRight: 'Sup. dcha.', bottomLeft: 'Inf. izq.', bottomRight: 'Inf. dcha.' } as const;
  const sub = scan.subgrades;
  return (
    <div className={`border rounded-[8px] p-3 space-y-3 text-xs ${t.rule} ${t.text}`}>
      <p className={t.muted}>
        Informe del escáner · criterios {scan.criteria} · notas emitidas el {scan.gradedAt} · {scan.ppi ?? '—'} ppp ·{' '}
        {scan.sides === 'front' ? 'solo anverso' : 'anverso y reverso'}
        {scan.card.name && ` · ${scan.card.name}`}
      </p>
      <dl className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {([
          ['Final', scan.final, `media ${scan.average.toLocaleString('es-ES')}`],
          ['Centrado', sub.centering.score, sub.centering.note],
          ['Esquinas', sub.corners.score, sub.corners.note],
          ['Bordes', sub.edges.score, sub.edges.note],
          ['Superficie', sub.surface.score, sub.surface.note],
        ] as const).map(([label, score, note]) => (
          <div key={label}>
            <dt className={`text-[12px] ${t.muted}`}>{label}</dt>
            <dd className="text-base font-bold">{score}</dd>
            {note && <dd className={`text-[11px] ${t.muted}`}>{note}</dd>}
          </div>
        ))}
      </dl>
      {scan.faces.map((face) => (
        <div key={face.side} className="space-y-1">
          <p className="font-bold">{face.side === 'front' ? 'Anverso' : 'Reverso'}</p>
          {face.centering && (
            <p>
              Centrado: izq. {face.centering.leftMm} · dcha. {face.centering.rightMm} · arriba {face.centering.topMm} · abajo {face.centering.bottomMm} mm ·{' '}
              {face.centering.horizontal} / {face.centering.vertical} · nota {face.centering.score}
            </p>
          )}
          <p>
            Esquinas: {face.corners.map((c) => `${corner[c.position]} ${c.score}`).join(' · ')}
            {face.cornersScore !== null && ` · cara ${face.cornersScore}`}
          </p>
          <p>Daños: {face.damages.length === 0 ? 'ninguno' : face.damages.map((d) => `${d.n} ${d.kind}${d.size ? ` (${{ small: 'pequeño', medium: 'mediano', large: 'grande' }[d.size]})` : ''}`).join(' · ')}</p>
        </div>
      ))}
      <p className={`font-mono text-[10px] break-all ${t.muted}`}>PDF SHA-256 {scan.pdfSha256}</p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Formulario del resultado
// ---------------------------------------------------------------------------

const GradingForm: React.FC<{
  initial: AdminGradingResult | null;
  busy: boolean;
  images: ImageDto[];
  onCancel: () => void;
  onSave: (body: GradingBody) => Promise<void>;
}> = ({ initial, busy, images, onCancel, onSave }) => {
  const t = usePanelTheme();
  const field = `w-full px-3 py-2 text-sm border rounded-[8px] focus:outline-none ${t.input}`;
  const label = `block text-[12px] mb-1 ${t.muted}`;

  const [authentic, setAuthentic] = useState(initial?.isAuthentic ?? true);
  const [scores, setScores] = useState<Scores>({
    centering: initial?.centering ? String(initial.centering.score) : '',
    corners: initial?.corners ? String(initial.corners.score) : '',
    edges: initial?.edges ? String(initial.edges.score) : '',
    surface: initial?.surface ? String(initial.surface.score) : '',
  });
  const [frontRatio, setFrontRatio] = useState(initial?.centering?.frontRatio ?? '');
  const [backRatio, setBackRatio] = useState(initial?.centering?.backRatio ?? '');
  const [notes, setNotes] = useState({
    centering: initial?.centering?.notes ?? '',
    corners: initial?.corners?.notes ?? '',
    edges: initial?.edges?.notes ?? '',
    surface: initial?.surface?.notes ?? '',
  });
  const [station, setStation] = useState(initial?.station ?? '');
  const [defects, setDefects] = useState<Defect[]>(initial?.defects ?? []);
  const [override, setOverride] = useState(initial?.finalGrade !== null && initial?.finalGrade !== undefined ? String(initial.finalGrade) : '');

  const complete = (['centering', 'corners', 'edges', 'surface'] as const).every((k) => scores[k] !== '');
  const trace = authentic && complete
    ? traceGrade({ centering: +scores.centering, corners: +scores.corners, edges: +scores.edges, surface: +scores.surface })
    : null;
  // Si la nota elegida a mano ya no cabe con las subnotas actuales, se usa la de las subnotas.
  const final = trace ? (override !== '' && +override <= trace.final ? +override : trace.final) : null;
  const finalScores = trace && { centering: +scores.centering, corners: +scores.corners, edges: +scores.edges, surface: +scores.surface };

  const build = (submit: boolean): GradingBody => {
    const text = (v: string) => v.trim() || undefined;
    if (!authentic) return { isAuthentic: false, station: text(station), defects: [], submit };
    return {
      isAuthentic: true,
      centering: { score: +scores.centering, frontRatio: text(frontRatio), backRatio: text(backRatio), notes: text(notes.centering) },
      corners: { score: +scores.corners, notes: text(notes.corners) },
      edges: { score: +scores.edges, notes: text(notes.edges) },
      surface: { score: +scores.surface, notes: text(notes.surface) },
      finalGrade: final !== null && trace && final !== trace.final ? final : undefined,
      station: text(station),
      defects: defects.map((d) => ({ ...d, description: d.description?.trim() || undefined })),
      submit,
    };
  };

  const ready = !authentic || (complete && final !== null);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(build(false));
      }}
    >
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={authentic} onChange={(e) => setAuthentic(e.target.checked)} />
        <span className={`font-bold ${t.text}`}>La carta es auténtica</span>
      </label>

      {authentic && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {([['centering', 'Centrado'], ['corners', 'Esquinas'], ['edges', 'Bordes'], ['surface', 'Superficie']] as const).map(([key, text]) => (
              <label key={key} className="block">
                <span className={label}>{text}</span>
                <select
                  value={scores[key]}
                  onChange={(e) => setScores({ ...scores, [key]: e.target.value })}
                  required
                  className={field}
                >
                  <option value="">—</option>
                  {SCALE.map((n) => <option key={n} value={n}>{fmt(n)}</option>)}
                </select>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className={label}>Centrado anverso</span>
              <input value={frontRatio} onChange={(e) => setFrontRatio(e.target.value)} maxLength={60} placeholder="52/48 L/R, 50/50 T/B" className={field} />
            </label>
            <label className="block">
              <span className={label}>Centrado reverso</span>
              <input value={backRatio} onChange={(e) => setBackRatio(e.target.value)} maxLength={60} placeholder="50/50 L/R, 51/49 T/B" className={field} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([['centering', 'Observaciones de centrado'], ['corners', 'Observaciones de esquinas'], ['edges', 'Observaciones de bordes'], ['surface', 'Observaciones de superficie']] as const).map(([key, text]) => (
              <label key={key} className="block">
                <span className={label}>{text} (las ve el cliente)</span>
                <textarea value={notes[key]} onChange={(e) => setNotes({ ...notes, [key]: e.target.value })} maxLength={500} rows={2} className={field} />
              </label>
            ))}
          </div>

          <div className={`border rounded-[8px] p-3 ${t.rule}`} aria-live="polite">
            {trace && finalScores && final !== null ? (
              <div className="space-y-2">
                <p className={`text-sm ${t.text}`}>
                  Nota que dan las subnotas: <strong>{fmt(trace.final)}</strong>
                  <span className={`block text-[11px] ${t.muted}`}>
                    Media {trace.average.toLocaleString('es-ES', { maximumFractionDigits: 2 })} → {fmt(trace.rounded)}
                    {trace.reasons.includes('weakest_caps') && ' · la peor subnota la limita'}
                    {trace.reasons.includes('top_needs_three_half') && ' · un 9,5 o un 10 necesita tres subnotas de 9,5 o más'}
                  </span>
                </p>
                <label className="block max-w-xs">
                  <span className={label}>Nota final (solo puedes bajarla)</span>
                  <select value={String(final)} onChange={(e) => setOverride(e.target.value)} className={field}>
                    {SCALE.filter((n) => n <= trace.final && GRADE_LABELS[n]).map((n) => (
                      <option key={n} value={n}>{fmt(n)}</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <p className={`text-xs ${t.muted}`}>Elige las cuatro subnotas para ver la nota final.</p>
            )}
          </div>

          <Defects defects={defects} onChange={setDefects} images={images} />
        </>
      )}

      <label className="block max-w-xs">
        <span className={label}>Estación (opcional)</span>
        <input value={station} onChange={(e) => setStation(e.target.value)} maxLength={60} className={field} />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy || !ready} className={`px-4 py-2.5 border rounded-[8px] text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t.secondary}`}>
          Guardar borrador
        </button>
        <button
          type="button"
          disabled={busy || !ready}
          onClick={() => void onSave(build(true))}
          className={`px-5 py-2.5 rounded-[8px] text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t.primary}`}
        >
          Enviar a control de calidad
        </button>
        <button type="button" onClick={onCancel} className={`px-4 py-2.5 text-xs font-bold cursor-pointer ${t.muted} hover:underline`}>
          Cancelar
        </button>
      </div>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Defectos
// ---------------------------------------------------------------------------

const Defects: React.FC<{ defects: Defect[]; onChange: (d: Defect[]) => void; images: ImageDto[] }> = ({ defects, onChange, images }) => {
  const t = usePanelTheme();
  const field = `px-3 py-2 text-sm border rounded-[8px] focus:outline-none ${t.input}`;
  const [draft, setDraft] = useState<Defect>({ side: 'front', category: 'corners', severity: 'minor', title: '', description: null, x: 50, y: 50, deduction: 0 });
  const photo = images.find((i) => i.kind === draft.side);

  return (
    <div className="space-y-3">
      <h4 className={`text-[12px] ${t.muted}`}>Defectos ({defects.length})</h4>
      {defects.length > 0 && (
        <ul className="space-y-1.5">
          {defects.map((d, i) => (
            <li key={i} className={`flex items-center gap-3 text-xs ${t.text}`}>
              <span className={`text-[12px] ${t.muted}`}>{d.side === 'front' ? 'Anv.' : 'Rev.'} · {CATEGORY_TEXT[d.category]} · {SEVERITY_TEXT[d.severity]}</span>
              <span className="flex-1">{d.title}</span>
              <span className={`font-mono ${t.muted}`}>{d.x}%, {d.y}%</span>
              <button type="button" aria-label={`Quitar defecto ${d.title}`} onClick={() => onChange(defects.filter((_, j) => j !== i))} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={`border rounded-[8px] p-3 space-y-3 ${t.rule}`}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select aria-label="Cara" value={draft.side} onChange={(e) => setDraft({ ...draft, side: e.target.value as Defect['side'] })} className={field}>
            <option value="front">Anverso</option>
            <option value="back">Reverso</option>
          </select>
          <select aria-label="Categoría" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Defect['category'] })} className={field}>
            {Object.entries(CATEGORY_TEXT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select aria-label="Gravedad" value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value as Defect['severity'] })} className={field}>
            {Object.entries(SEVERITY_TEXT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input aria-label="Título del defecto" placeholder="Qué se ve" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength={120} className={field} />
        </div>

        {photo ? (
          <div>
            <p className={`text-[11px] mb-1 ${t.muted}`}>Haz clic en la foto para marcar dónde está ({draft.x}%, {draft.y}%).</p>
            <div
              className="relative inline-block cursor-crosshair"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setDraft({
                  ...draft,
                  x: Math.round(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)) * 10) / 10,
                  y: Math.round(Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)) * 10) / 10,
                });
              }}
            >
              <img src={photo.url} alt={`Foto ${draft.side === 'front' ? 'anverso' : 'reverso'}`} className="max-h-64 w-auto rounded border select-none" draggable={false} />
              <span className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-red-500 bg-red-500/30 pointer-events-none" style={{ left: `${draft.x}%`, top: `${draft.y}%` }} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-w-xs">
            <input aria-label="Posición horizontal (%)" type="number" min={0} max={100} step={0.1} value={draft.x} onChange={(e) => setDraft({ ...draft, x: Number(e.target.value) })} className={field} />
            <input aria-label="Posición vertical (%)" type="number" min={0} max={100} step={0.1} value={draft.y} onChange={(e) => setDraft({ ...draft, y: Number(e.target.value) })} className={field} />
          </div>
        )}

        <button
          type="button"
          disabled={!draft.title.trim()}
          onClick={() => {
            onChange([...defects, { ...draft, title: draft.title.trim() }]);
            setDraft({ ...draft, title: '' });
          }}
          className={`px-4 py-2 border rounded-[8px] text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t.secondary}`}
        >
          Añadir defecto
        </button>
      </div>
    </div>
  );
};
