import type { Db } from '../db/client.js';
import type { UserDto } from '../shared/auth.js';
import type { SendLoginCode } from './email/login-code.js';
import type { SendMail } from './email/transport.js';
import type { Signer } from './signing.js';
import type { ObjectStorage } from './storage.js';

/** Dependencias que se inyectan al crear la app, para poder sustituirlas en las pruebas. */
export type Deps = {
  getDb: () => Db;
  sendLoginCode: SendLoginCode;
  sendMail: SendMail;
  storage: ObjectStorage;
  /** Firmador de certificados. Falla con 503 si no hay clave configurada. */
  getSigner: () => Signer;
};

export type AppEnv = {
  Variables: {
    requestId: string;
    user: UserDto;
  };
};
