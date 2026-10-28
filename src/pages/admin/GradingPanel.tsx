import React, { useRef, useState } from 'react';
import { Camera, Trash2, X } from 'lucide-react';
import type { AdminOrderDetail } from '../../../shared/admin';
import type { AdminGradingResult, GradingBody } from '../../../shared/grading-admin';
import { GRADE_LABELS, deriveGradeLabel, traceGrade } from '../../../shared/grading';
import type { ImageDto } from '../../../shared/photos';
import {
  adminErrorMessage, approveGrading, deleteItemImage, rejectGrading, saveGrading, uploadItemImage,
} from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import { usePanelTheme } from './ui';

type Item = AdminOrderDetail['items'][number];
type Defect = AdminGradingResult['defects'][number];

/** Mientras el pedido está en el laboratorio y no en pausa se puede graduar (igual que en el servidor). */
const GRADABLE = ['PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE'];
const SCALE = Array.from({ length: 19 }, (_, i) => 10 - i * 0.5);
const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 1 });

const STATUS_TEXT: Record<AdminGradingResult['status'], string> = {
  draft: 'Borrador',
  pending_qa: 'Pendiente de calidad',
  approved: 'Aprobado',
};

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
  const grading = item.grading;
  const gradable = GRADABLE.includes(order.order.status);
  const canGrade = gradable && (role === 'grader' || role === 'admin') && (!grading || grading.status !== 'approved' || role === 'admin');
  const canReview = gradable && (role === 'qa' || role === 'admin') && grading?.status === 'pending_qa';
  const ownWork = !!grading && grading.gradedBy === user?.email;
  const canPhoto = ['staff', 'grader', 'admin'].includes(role);

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

  return (
    <details className={`border rounded-lg ${t.rule}`}>
      <summary className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 cursor-pointer select-none">
        <span className={`font-mono text-xs ${t.muted}`}>{String(item.position).padStart(2, '0')}</span>
        <span className={`font-bold text-sm ${t.text}`}>{item.cardName}</span>
        <span className="flex-1" />
        {grading ? (
          <span className={`text-xs font-bold ${grading.status === 'approved' ? t.positive : t.isLight ? 'text-amber-700' : 'text-amber-300'}`}>
            {STATUS_TEXT[grading.status]}
            {grading.finalGrade !== null && ` · ${fmt(grading.finalGrade)} ${grading.gradeLabel ?? ''}`}
            {!grading.isAuthentic && ' · No auténtica'}
          </span>
        ) : (
          <span className={`text-xs ${t.muted}`}>Sin resultado</span>
        )}
        <span className={`text-[11px] ${t.muted}`}>{images.length} {images.length === 1 ? 'foto' : 'fotos'}</span>
      </summary>

      <div className={`border-t px-4 py-4 space-y-5 ${t.rule}`}>
        {local && (
          <p role={local.kind === 'error' ? 'alert' : 'status'} className={`text-xs font-bold ${local.kind === 'error' ? 'text-red-500' : t.positive}`}>
            {local.text}
          </p>
        )}

        <Photos code={code} position={item.position} images={images} canPhoto={canPhoto} busy={busy} run={run} />

        {grading && !editing && <ResultView grading={grading} />}

        {canReview && !ownWork && (
          <ReviewActions
            busy={busy}
            onApprove={() => run(() => approveGrading(code, item.position), 'Resultado aprobado.')}
            onReject={(reason) => run(() => rejectGrading(code, item.position, reason), 'Devuelto al graduador como borrador.')}
          />
        )}
        {canReview && ownWork && (
          <p className={`text-xs ${t.isLight ? 'text-amber-700' : 'text-amber-300'}`}>
            Graduaste esta carta tú: la aprobación tiene que hacerla otra persona.
          </p>
        )}

        {canGrade && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={`px-4 py-2.5 border rounded-lg text-xs font-bold cursor-pointer ${t.secondary}`}
          >
            {grading ? (grading.status === 'approved' ? 'Corregir resultado (nueva versión)' : 'Editar resultado') : 'Introducir resultado'}
          </button>
        )}

        {canGrade && editing && (
          <GradingForm
            key={`${grading?.version ?? 0}-${grading?.status ?? 'none'}`}
            initial={grading}
            busy={busy}
            images={images}
            onCancel={() => setEditing(false)}
            onSave={async (body) => {
              const ok = await run(
                () => saveGrading(code, item.position, body),
                body.submit ? 'Enviado a control de calidad.' : 'Borrador guardado.',
              );
              if (ok) setEditing(false);
            }}
          />
        )}
      </div>
    </details>
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
  const [kind, setKind] = useState<'front' | 'back' | 'extra'>('front');

  return (
    <div>
      <h4 className={`font-mono text-[10px] uppercase tracking-wider mb-2 ${t.muted}`}>Fotos</h4>
      {images.length > 0 && (
        <ul className="flex flex-wrap gap-3 mb-3">
          {images.map((img) => (
            <li key={img.id} className="relative">
              <a href={img.url} target="_blank" rel="noreferrer">
                <img src={img.url} alt={KIND_TEXT[img.kind]} className={`h-24 w-auto rounded border object-contain ${t.rule}`} />
              </a>
              <span className={`absolute left-1 bottom-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${t.isLight ? 'bg-white/90 text-[#14170F]' : 'bg-black/70 text-white'}`}>
                {KIND_TEXT[img.kind]}
              </span>
              {canPhoto && (
                <button
                  type="button"
                  aria-label={`Borrar foto ${KIND_TEXT[img.kind]}`}
                  disabled={busy}
                  onClick={() => window.confirm('¿Borrar esta foto?') && void run(() => deleteItemImage(code, position, img.id), 'Foto borrada.')}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-red-600 text-white cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {canPhoto ? (
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Tipo de foto" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={`px-3 py-2 text-xs border rounded-lg ${t.input}`}>
            <option value="front">Anverso</option>
            <option value="back">Reverso</option>
            <option value="extra">Extra (detalle)</option>
          </select>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void run(() => uploadItemImage(code, position, kind, file), 'Foto subida.');
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 ${t.secondary}`}
          >
            <Camera className="w-4 h-4" /> {busy ? 'Subiendo…' : 'Subir foto'}
          </button>
          <span className={`text-[11px] ${t.muted}`}>JPEG, PNG o WebP · hasta 30 MB</span>
        </div>
      ) : images.length === 0 ? (
        <p className={`text-xs ${t.muted}`}>Todavía no hay fotos.</p>
      ) : null}
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
      <h4 className={`font-mono text-[10px] uppercase tracking-wider ${t.muted}`}>
        Resultado · versión {grading.version} · graduó {grading.gradedBy}
        {grading.qaApprovedBy && ` · aprobó ${grading.qaApprovedBy}`}
      </h4>
      {!grading.isAuthentic ? (
        <p className={`text-sm font-bold ${t.negative}`}>No se ha podido autenticar la carta.</p>
      ) : (
        <>
          <p className={`text-lg font-[900] ${t.text}`}>
            {grading.finalGrade !== null && fmt(grading.finalGrade)} <span className="text-sm font-bold">{grading.gradeLabel}</span>
          </p>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className={`font-mono text-[10px] uppercase tracking-wider ${t.muted}`}>{label}</dt>
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
              <span className={`font-mono text-[10px] uppercase mr-2 ${t.muted}`}>{d.side === 'front' ? 'Anv.' : 'Rev.'} · {CATEGORY_TEXT[d.category]} · {SEVERITY_TEXT[d.severity]}</span>
              {d.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Revisión de calidad
// ---------------------------------------------------------------------------

const ReviewActions: React.FC<{ busy: boolean; onApprove: () => void; onReject: (reason: string) => void }> = ({ busy, onApprove, onReject }) => {
  const t = usePanelTheme();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <div className={`border rounded-lg p-3 space-y-3 ${t.rule}`}>
      <p className={`text-xs font-bold ${t.text}`}>Control de calidad</p>
      {!rejecting ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={onApprove} className={`px-4 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer disabled:opacity-50 ${t.primary}`}>
            Aprobar resultado
          </button>
          <button type="button" disabled={busy} onClick={() => setRejecting(true)} className={`px-4 py-2.5 border rounded-lg text-xs font-bold cursor-pointer ${t.secondary}`}>
            Devolver para revisar
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            aria-label="Motivo de la devolución"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Motivo (queda registrado)"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none ${t.input}`}
          />
          <div className="flex gap-2">
            <button type="button" disabled={busy || !reason.trim()} onClick={() => onReject(reason.trim())} className={`px-4 py-2 rounded-lg text-xs font-extrabold cursor-pointer disabled:opacity-50 ${t.primary}`}>
              Devolver
            </button>
            <button type="button" onClick={() => setRejecting(false)} className={`px-4 py-2 border rounded-lg text-xs font-bold cursor-pointer ${t.secondary}`}>
              Cancelar
            </button>
          </div>
        </div>
      )}
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
  const field = `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none ${t.input}`;
  const label = `block font-mono text-[10px] uppercase tracking-wider mb-1 ${t.muted}`;

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

          <div className={`border rounded-lg p-3 ${t.rule}`} aria-live="polite">
            {trace && finalScores && final !== null ? (
              <div className="space-y-2">
                <p className={`text-sm ${t.text}`}>
                  Nota que dan las subnotas: <strong>{fmt(trace.final)}</strong> · {deriveGradeLabel(trace.final, finalScores)}
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
                      <option key={n} value={n}>{fmt(n)} · {deriveGradeLabel(n, finalScores)}</option>
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
        <button type="submit" disabled={busy || !ready} className={`px-4 py-2.5 border rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t.secondary}`}>
          Guardar borrador
        </button>
        <button
          type="button"
          disabled={busy || !ready}
          onClick={() => void onSave(build(true))}
          className={`px-5 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t.primary}`}
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
  const field = `px-3 py-2 text-sm border rounded-lg focus:outline-none ${t.input}`;
  const [draft, setDraft] = useState<Defect>({ side: 'front', category: 'corners', severity: 'minor', title: '', description: null, x: 50, y: 50, deduction: 0 });
  const photo = images.find((i) => i.kind === draft.side);

  return (
    <div className="space-y-3">
      <h4 className={`font-mono text-[10px] uppercase tracking-wider ${t.muted}`}>Defectos ({defects.length})</h4>
      {defects.length > 0 && (
        <ul className="space-y-1.5">
          {defects.map((d, i) => (
            <li key={i} className={`flex items-center gap-3 text-xs ${t.text}`}>
              <span className={`font-mono text-[10px] uppercase ${t.muted}`}>{d.side === 'front' ? 'Anv.' : 'Rev.'} · {CATEGORY_TEXT[d.category]} · {SEVERITY_TEXT[d.severity]}</span>
              <span className="flex-1">{d.title}</span>
              <span className={`font-mono ${t.muted}`}>{d.x}%, {d.y}%</span>
              <button type="button" aria-label={`Quitar defecto ${d.title}`} onClick={() => onChange(defects.filter((_, j) => j !== i))} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={`border rounded-lg p-3 space-y-3 ${t.rule}`}>
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
          className={`px-4 py-2 border rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t.secondary}`}
        >
          Añadir defecto
        </button>
      </div>
    </div>
  );
};
