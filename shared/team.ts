/**
 * Equipo: las cuentas con un rol del laboratorio. La dirección las da de alta con el correo de
 * cada persona, que entra como todos, con el código que le llega al correo.
 */
import { z } from 'zod';
import { STAFF_ROLES, type StaffRole } from './admin.js';

/** Qué puede hacer cada rol. Es lo que comprueba el servidor (server/domain/order-flow.ts y las rutas). */
export const ROLE_INFO: Record<StaffRole, { name: string; summary: string; can: string[] }> = {
  staff: {
    name: 'Recepción y logística',
    summary: 'Recibe los paquetes, identifica las cartas y gestiona los envíos.',
    can: ['Confirmar la llegada de los paquetes', 'Identificar las cartas y hacer las fotos', 'Registrar envíos y confirmar entregas', 'Pausar y reanudar pedidos'],
  },
  grader: {
    name: 'Calificación',
    summary: 'Califica las cartas: subnotas, defectos y nota final.',
    can: ['Introducir el resultado de cada carta', 'Identificar las cartas y hacer las fotos', 'Enviar resultados a control de calidad'],
  },
  qa: {
    name: 'Control de calidad',
    summary: 'Revisa el trabajo de calificación y aprueba la salida de los pedidos.',
    can: ['Aprobar o devolver resultados', 'Aprobar la salida de los pedidos'],
  },
  admin: {
    name: 'Dirección',
    summary: 'Acceso completo: negocio, eventos, equipo y todo el laboratorio.',
    can: ['Todo lo de los demás roles', 'Ver el panel de negocio', 'Gestionar el calendario de eventos', 'Dar de alta y cambiar el rol del equipo'],
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
