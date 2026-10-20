import type { Db } from '../db/client.js';
import type { UserDto } from '../shared/auth.js';
import type { SendLoginCode } from './email/login-code.js';

/** Dependencias que se inyectan al crear la app, para poder sustituirlas en las pruebas. */
export type Deps = {
  getDb: () => Db;
  sendLoginCode: SendLoginCode;
};

export type AppEnv = {
  Variables: {
    requestId: string;
    user: UserDto;
  };
};
