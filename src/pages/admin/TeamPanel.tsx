import React, { useCallback, useEffect, useState } from 'react';
import { Check, ChevronRight, ClipboardList, Crown, Mail, PackageOpen, Plus, ShieldCheck, UserMinus, UserPlus, X, type LucideIcon } from 'lucide-react';
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
  // false = cerrado; si se abre desde un puesto, ese puesto llega ya elegido.
  const [adding, setAdding] = useState<boolean | StaffRole>(false);
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

  const byRole = (role: StaffRole) => members?.filter((m) => m.role === role) ?? [];
  const activeToday = members?.filter((m) => m.activated && m.lastSeenAt && Date.now() - new Date(m.lastSeenAt).getTime() < 86_400_000).length ?? 0;
  const pending = members?.filter((m) => !m.activated).length ?? 0;

  const changeRole = (m: TeamMemberDto, role: StaffRole) => {
    if (window.confirm(`¿Cambiar a ${m.email} a «${ROLE_INFO[role].name}»? Tendrá que volver a entrar.`)) {
      void act(m.id, () => changeTeamRole(m.id, role), `Rol cambiado a «${ROLE_INFO[role].name}».`);
    }
  };
  const remove = (m: TeamMemberDto) => {
    if (window.confirm(`¿Quitar a ${m.email} del equipo? Perderá el acceso al panel, pero su historial se conserva.`)) {
      void act(m.id, () => removeTeamMember(m.id), `${m.email} ya no tiene acceso al panel.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className={`text-xs max-w-xl ${t.muted}`}>Cada persona entra con su correo y el código que le llega. Su puesto decide qué puede hacer en el panel.</p>
        <button type="button" onClick={() => setAdding(true)} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-extrabold cursor-pointer ${t.primary}`}>
          <UserPlus className="w-4 h-4" aria-hidden="true" />
          Añadir persona
        </button>
      </div>

      {/* Lectura rápida del equipo */}
      {members && (
        <dl className={`grid grid-cols-3 border rounded-xl overflow-hidden divide-x ${t.card} ${t.rule}`}>
          {[
            { label: 'Personas', value: members.length },
            { label: 'Activas en 24 h', value: activeToday },
            { label: 'Sin primer acceso', value: pending },
          ].map((stat) => (
            <div key={stat.label} className={`px-4 py-3 ${t.rule}`}>
              <dd className={`font-['Nunito',sans-serif] text-2xl font-[900] leading-none ${t.text}`}>{stat.value}</dd>
              <dt className={`mt-1.5 font-mono text-[10px] uppercase tracking-wider ${t.muted}`}>{stat.label}</dt>
            </div>
          ))}
        </dl>
      )}

      {error && <p role="alert" className={`text-sm ${t.negative}`}>{error}</p>}
      {notice && <p role="status" className={`text-sm ${t.positive}`}>{notice}</p>}
      {members === null && !error && <p className={`text-sm ${t.muted}`}>Cargando…</p>}

      {/* El recorrido de un pedido por el laboratorio: cada puesto con sus personas y lo que puede hacer */}
      {members && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STAFF_ROLES.map((role, index) => {
            const { color, icon: Icon } = ROLE_STYLE[role];
            const info = ROLE_INFO[role];
            const people = byRole(role);
            return (
              <section key={role} className={`relative flex flex-col border rounded-2xl ${t.card}`} aria-label={info.name}>
                <div className="h-1 rounded-t-2xl" style={{ background: color }} aria-hidden="true" />
                {index < STAFF_ROLES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`hidden xl:flex absolute -right-[13px] top-9 z-10 w-[22px] h-[22px] rounded-full border items-center justify-center ${t.card}`}
                  >
                    <ChevronRight className={`w-3.5 h-3.5 ${t.muted}`} />
                  </span>
                )}

                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] font-bold tracking-[0.2em]" style={{ color }}>PUESTO {String(index + 1).padStart(2, '0')}</div>
                      <h3 className={`mt-1 font-['Nunito',sans-serif] text-lg font-[900] leading-tight ${t.text}`}>{info.name}</h3>
                    </div>
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}1F`, color }}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                  </div>
                  <p className={`mt-2.5 text-xs leading-relaxed ${t.muted}`}>{info.summary}</p>

                  <details className="group mt-3">
                    <summary className={`inline-flex items-center gap-1 cursor-pointer select-none list-none text-[11px] font-bold ${t.text} [&::-webkit-details-marker]:hidden`}>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" aria-hidden="true" />
                      Ver permisos
                    </summary>
                    <ul className="mt-2 space-y-1.5">
                      {info.can.map((c) => (
                        <li key={c} className={`flex items-start gap-1.5 text-[11px] leading-snug ${t.muted}`}>
                          <Check className="w-3 h-3 mt-0.5 shrink-0" style={{ color }} aria-hidden="true" />
                          {c}
                        </li>
                      ))}
                      {info.also?.map((c) => (
                        <li key={c} className={`flex items-start gap-1.5 text-[11px] leading-snug italic ${t.muted}`}>
                          <Plus className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                          También: {c.charAt(0).toLowerCase() + c.slice(1)}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>

                {/* Las personas de este puesto */}
                <div className={`flex-1 flex flex-col border-t rounded-b-2xl ${t.rule} ${t.isLight ? 'bg-[#FAF8F5]' : 'bg-[#2F2F2F]'}`}>
                  <div className={`flex items-center justify-between px-5 pt-3 pb-1 font-mono text-[10px] uppercase tracking-wider ${t.muted}`}>
                    <span>{people.length} {people.length === 1 ? 'persona' : 'personas'}</span>
                  </div>
                  <ul className="px-3 pb-3 space-y-1.5 flex-1">
                    {people.map((m) => {
                      const me = m.id === user.id;
                      const busy = busyId === m.id;
                      return (
                        <li key={m.id} className={`rounded-xl border px-3 py-2.5 ${t.card}`}>
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ background: color }} aria-hidden="true">
                              {initials(m)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`truncate text-[13px] font-bold ${t.text}`}>{m.fullName ?? m.email}</span>
                                {me && <span className={`text-[9px] font-bold px-1.5 py-px rounded border ${t.rule} ${t.muted}`}>TÚ</span>}
                              </div>
                              {m.fullName && <div className={`truncate text-[11px] ${t.muted}`}>{m.email}</div>}
                            </div>
                          </div>
                          <div className={`mt-2 flex items-center gap-1.5 text-[11px] ${t.muted}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.activated ? 'bg-[#16A34A]' : 'bg-[#D97706]'}`} aria-hidden="true" />
                            {m.activated ? lastSeen(m.lastSeenAt) : 'Pendiente de su primer acceso'}
                          </div>
                          {!me && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <label className="sr-only" htmlFor={`role-${m.id}`}>Puesto de {m.email}</label>
                              <select
                                id={`role-${m.id}`}
                                value={m.role}
                                disabled={busy}
                                onChange={(e) => changeRole(m, e.target.value as StaffRole)}
                                className={`flex-1 min-w-0 px-2 py-1.5 text-[11px] font-bold border rounded-md focus:outline-none disabled:opacity-60 cursor-pointer ${t.input}`}
                                title="Cambiar de puesto"
                              >
                                {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_INFO[r].name}</option>)}
                              </select>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => remove(m)}
                                aria-label={`Quitar a ${m.email} del equipo`}
                                title="Quitar del equipo"
                                className={`p-1.5 border rounded-md cursor-pointer disabled:opacity-50 ${t.secondary}`}
                              >
                                <UserMinus className={`w-3.5 h-3.5 ${t.negative}`} aria-hidden="true" />
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                    {people.length === 0 && (
                      <li className={`rounded-xl border border-dashed px-3 py-4 text-center text-[11px] ${t.rule} ${t.muted}`}>Nadie tiene este puesto todavía.</li>
                    )}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setAdding(role)}
                    className={`mx-3 mb-3 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed text-[11px] font-bold cursor-pointer ${t.rule} ${t.muted} ${t.ghostHover}`}
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Añadir a este puesto
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {adding && (
        <AddMemberForm
          initialRole={typeof adding === 'string' ? adding : 'staff'}
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

const AddMemberForm: React.FC<{ initialRole: StaffRole; onCancel: () => void; onAdded: (email: string) => void }> = ({ initialRole, onCancel, onAdded }) => {
  const t = usePanelTheme();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<StaffRole>(initialRole);
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
