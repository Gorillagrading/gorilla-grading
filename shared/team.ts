/**
 * Equipo: las cuentas con un rol del laboratorio. La dirección las da de alta con el correo de
 * cada persona, que entra como todos, con el código que le llega al correo.
 */
import { z } from 'zod';
import { STAFF_ROLES, type StaffRole } from './admin.js';

/**
 * Qué hace cada rol. `can` es lo propio del rol y `also` lo que comparte con otro (por ejemplo, quien
 * recibe y quien califica pueden identificar y fotografiar la carta). Los permisos reales los
 * comprueba el servidor (server/domain/order-flow.ts y las rutas).
 */
export const ROLE_INFO: Record<StaffRole, { name: string; summary: string; can: string[]; also?: string[] }> = {
  staff: {
    name: 'Recepción y logística',
    summary: 'Mueve los paquetes: los recibe, prepara las cartas y las devuelve al cliente.',
    can: ['Confirmar la llegada de los paquetes', 'Registrar los envíos de vuelta y confirmar las entregas', 'Pausar y reanudar pedidos'],
    also: ['Identificar las cartas y hacer las fotos'],
  },
  grader: {
    name: 'Calificación',
    summary: 'Pone la nota: subnotas, defectos y nota final de cada carta.',
    can: ['Calificar cada carta: subnotas, defectos y nota final', 'Enviar los resultados a control de calidad', 'Corregir lo que devuelve control de calidad'],
    also: ['Identificar las cartas y hacer las fotos'],
  },
  qa: {
    name: 'Control de calidad',
    summary: 'Revisa la nota que pone otra persona y aprueba la salida de los pedidos.',
    can: ['Aprobar o devolver los resultados de calificación', 'Aprobar la salida de los pedidos'],
  },
  admin: {
    name: 'Dirección',
    summary: 'Acceso completo: negocio, eventos, equipo y todo el laboratorio.',
    can: ['Ver el panel de negocio', 'Gestionar el calendario de eventos', 'Dar de alta al equipo y cambiar sus roles'],
    also: ['Todo lo que hacen los demás roles'],
  },
};

export const AddMemberBody = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  fullName: z.string().trim().max(120).optional(),
  role: z.enum(STAFF_ROLES),
});
export type AddMemberBody = z.infer<typeof AddMemberBody>;

export const ChangeRoleBody = z.object({ role: z.enum(STAFF_ROLES) });
export type ChangeRoleBody = z.infer<typeof ChangeRoleBody>;

export interface TeamMemberDto {
  id: string;
  email: string;
  fullName: string | null;
  role: StaffRole;
  /** Ya entró alguna vez con su código. */
  activated: boolean;
  /** Última vez que usó la plataforma; null si nunca ha entrado. */
  lastSeenAt: string | null;
  addedAt: string;
}
