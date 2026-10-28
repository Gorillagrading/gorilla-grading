import React, { useCallback, useEffect, useState } from 'react';
import { Check, ClipboardList, Crown, Mail, PackageOpen, Plus, ShieldCheck, UserMinus, UserPlus, X, type LucideIcon } from 'lucide-react';
import { STAFF_ROLES, type StaffRole } from '../../../shared/admin';
import type { UserDto } from '../../../shared/auth';
import { ROLE_INFO, type TeamMemberDto } from '../../../shared/team';
import { addTeamMember, adminErrorMessage, changeTeamRole, fetchTeam, removeTeamMember } from '../../api/admin';
import { usePanelTheme } from './ui';

/** Color e icono de cada rol, iguales en las tarjetas, las insignias y el formulario. */
const ROLE_STYLE: Record<StaffRole, { color: string; icon: LucideIcon }> = {
  staff: { color: '#0284C7', icon: PackageOpen },
  grader: { color: '#16A34A', icon: ClipboardList },
  qa: { color: '#4F46E5', icon: ShieldCheck },
  admin: { color: '#B45309', icon: Crown },
};

const initials = (m: TeamMemberDto) => {
  const parts = (m.fullName?.trim() || m.email).split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
};

function lastSeen(iso: string | null): string {
  if (!iso) return 'Aún no ha entrado';
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 5) return 'Activo ahora';
  if (minutes < 60) return `Activo hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Activo hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Activo ayer' : `Activo hace ${days} días`;
}

/**
 * Equipo del laboratorio: quién tiene acceso y con qué rol. La dirección da de alta a cada persona
 * con su correo; le llega un aviso y entra como todos, con el código que recibe al iniciar sesión.
 */
export const TeamPanel: React.FC<{ user: UserDto }> = ({ user }) => {
  const t = usePanelTheme();
  const [members, setMembers] = useState<TeamMemberDto[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchTeam()
      .then((list) => {
        setMembers(list);
        setError('');
      })
      .catch((err) => setError(adminErrorMessage(err)));
  }, []);
  useEffect(load, [load]);

  const act = async (id: string, work: () => Promise<unknown>, done: string) => {
    setBusyId(id);
    setError('');
    setNotice('');
    try {
      await work();
      setNotice(done);
      load();
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const count = (role: StaffRole) => members?.filter((m) => m.role === role).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={`font-['Nunito',sans-serif] text-lg font-[900] ${t.text}`}>
            Equipo {members && <span className={`font-mono text-sm ${t.muted}`}>· {members.length} {members.length === 1 ? 'persona' : 'personas'}</span>}
          </h2>
          <p className={`text-xs ${t.muted}`}>Cada persona entra con su correo y el código que le llega. Su rol decide qué puede hacer en el panel.</p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer ${t.primary}`}>
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          Añadir persona
        </button>
      </div>

      {error && <p role="alert" className={`text-sm ${t.negative}`}>{error}</p>}
      {notice && <p role="status" className={`text-sm ${t.positive}`}>{notice}</p>}

      {/* Los roles y qué puede hacer cada uno */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {STAFF_ROLES.map((role) => {
          const { color, icon: Icon } = ROLE_STYLE[role];
          const info = ROLE_INFO[role];
          return (
            <section key={role} className={`border rounded-2xl p-4 ${t.card}`} aria-label={info.name}>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: color }}>
                  <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold ${t.text}`}>{info.name}</div>
                  <div className={`text-[11px] ${t.muted}`}>{count(role)} {count(role) === 1 ? 'persona' : 'personas'}</div>
                </div>
              </div>
              <p className={`mt-3 text-xs font-semibold leading-snug ${t.text}`}>{info.summary}</p>
              <ul className="mt-2 space-y-1">
                {info.can.map((c) => (
                  <li key={c} className={`flex items-start gap-1.5 text-[11px] leading-snug ${t.muted}`}>
                    <Check className="w-3 h-3 mt-0.5 shrink-0" style={{ color }} aria-hidden="true" />
                    {c}
                  </li>
                ))}
              </ul>
              {info.also && (
                <div className={`mt-2.5 pt-2.5 border-t ${t.rule}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${t.muted}`}>También puede</div>
                  <ul className="space-y-1">
                    {info.also.map((c) => (
                      <li key={c} className={`flex items-start gap-1.5 text-[11px] leading-snug ${t.muted}`}>
                        <Plus className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Personas */}
      <section className={`border rounded-2xl overflow-hidden ${t.card}`} aria-label="Personas del equipo">
        {members === null && !error && <p className={`px-5 py-8 text-sm ${t.muted}`}>Cargando…</p>}
        <ul>
          {members?.map((m) => {
            const { color } = ROLE_STYLE[m.role];
            const me = m.id === user.id;
            const busy = busyId === m.id;
            return (
              <li key={m.id} className={`flex flex-wrap items-center gap-4 px-5 py-4 border-b last:border-b-0 ${t.rule}`}>
                <span className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: color }} aria-hidden="true">
                  {initials(m)}
                </span>
                <div className="flex-1 min-w-[200px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-sm font-bold ${t.text}`}>{m.fullName ?? m.email}</span>
                    {me && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${t.rule} ${t.muted}`}>Tú</span>}
                  </div>
                  <div className={`text-xs ${t.muted}`}>{m.fullName ? m.email : ''}</div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs w-[170px] ${t.muted}`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${m.activated ? 'bg-[#16A34A]' : 'bg-[#D97706]'}`} aria-hidden="true" />
                  {m.activated ? lastSeen(m.lastSeenAt) : 'Pendiente de su primer acceso'}
                </div>
                <label className="sr-only" htmlFor={`role-${m.id}`}>Rol de {m.email}</label>
                <select
                  id={`role-${m.id}`}
                  value={m.role}
                  disabled={me || busy}
                  title={me ? 'No puedes cambiar tu propio rol' : undefined}
                  onChange={(e) => {
                    const role = e.target.value as StaffRole;
                    if (window.confirm(`¿Cambiar a ${m.email} a «${ROLE_INFO[role].name}»? Tendrá que volver a entrar.`)) {
                      void act(m.id, () => changeTeamRole(m.id, role), `Rol cambiado a «${ROLE_INFO[role].name}».`);
                    }
                  }}
                  className={`px-3 py-2 text-xs font-bold border rounded-lg focus:outline-none disabled:opacity-60 ${t.input}`}
                  style={{ borderLeft: `4px solid ${color}` }}
                >
                  {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_INFO[r].name}</option>)}
                </select>
                {!me && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`¿Quitar a ${m.email} del equipo? Perderá el acceso al panel, pero su historial se conserva.`)) {
                        void act(m.id, () => removeTeamMember(m.id), `${m.email} ya no tiene acceso al panel.`);
                      }
                    }}
                    aria-label={`Quitar a ${m.email} del equipo`}
                    title="Quitar del equipo"
                    className={`p-2 border rounded-lg cursor-pointer disabled:opacity-50 ${t.secondary}`}
                  >
                    <UserMinus className={`w-4 h-4 ${t.negative}`} aria-hidden="true" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {adding && (
        <AddMemberForm
          onCancel={() => setAdding(false)}
          onAdded={(email) => {
            setAdding(false);
            setNotice(`Hemos dado de alta a ${email} y le hemos enviado un correo para que entre.`);
            load();
          }}
        />
      )}
    </div>
  );
};

const AddMemberForm: React.FC<{ onCancel: () => void; onAdded: (email: string) => void }> = ({ onCancel, onAdded }) => {
  const t = usePanelTheme();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<StaffRole>('staff');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const field = `w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none ${t.input}`;
  const label = `block text-xs font-bold mb-1 ${t.text}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true" aria-label="Añadir persona">
      <form
        className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto border rounded-2xl ${t.card}`}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          try {
            await addTeamMember({ email: email.trim(), fullName: fullName.trim() || undefined, role });
            onAdded(email.trim().toLowerCase());
          } catch (err) {
            setError(adminErrorMessage(err));
            setBusy(false);
          }
        }}
      >
        <header className={`flex items-center justify-between px-6 py-4 border-b ${t.rule}`}>
          <h3 className={`font-['Nunito',sans-serif] text-lg font-[900] ${t.text}`}>Añadir persona al equipo</h3>
          <button type="button" onClick={onCancel} aria-label="Cerrar" className={`p-1.5 rounded-lg cursor-pointer ${t.ghostHover} ${t.text}`}>
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className={label}>Correo *</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} placeholder="persona@gorillagrading.com" className={field} />
            </label>
            <label className="block">
              <span className={label}>Nombre</span>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} placeholder="Nombre y apellido" className={field} />
            </label>
          </div>

          <fieldset>
            <legend className={label}>Rol *</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              {STAFF_ROLES.map((r) => {
                const { color, icon: Icon } = ROLE_STYLE[r];
                const picked = r === role;
                return (
                  <label
                    key={r}
                    className={`flex gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-colors ${picked ? '' : t.rule}`}
                    style={picked ? { borderColor: color } : undefined}
                  >
                    <input type="radio" name="role" value={r} checked={picked} onChange={() => setRole(r)} className="sr-only" />
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: color }}>
                      <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                    </span>
                    <span className="flex-1">
                      <span className={`block text-sm font-bold ${t.text}`}>{ROLE_INFO[r].name}</span>
                      <span className={`block text-[11px] leading-snug ${t.muted}`}>{ROLE_INFO[r].summary}</span>
                    </span>
                    {picked && <Check className="w-4 h-4 shrink-0" style={{ color }} aria-hidden="true" />}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <p className={`flex items-start gap-2 text-xs ${t.muted}`}>
            <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
            Le enviaremos un correo avisándole de su acceso. Para entrar solo tiene que escribir su correo en «Iniciar sesión» y el código que le llegue. Si ya era cliente, conserva su cuenta.
          </p>
          {error && <p role="alert" className={`text-sm ${t.negative}`}>{error}</p>}
        </div>
        <footer className={`flex justify-end gap-2 px-6 py-4 border-t ${t.rule}`}>
          <button type="button" onClick={onCancel} className={`px-4 py-2.5 text-xs font-bold cursor-pointer ${t.muted} hover:underline`}>Cancelar</button>
          <button type="submit" disabled={busy || !email.includes('@')} className={`px-5 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer disabled:opacity-50 ${t.primary}`}>
            {busy ? 'Dando de alta…' : 'Dar de alta y avisar'}
          </button>
        </footer>
      </form>
    </div>
  );
};
