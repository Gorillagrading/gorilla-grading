/**
 * Punto de entrada de Vercel Functions. vercel.json reescribe /api/* hacia aquí
 * y Hono enruta según la URL original.
 */
import { handle } from 'hono/vercel';
import { app } from '../server/app';

const handler = handle(app);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
