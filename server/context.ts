import type { Db } from '../db/client';
import type { UserDto } from '../shared/auth';
import type { SendLoginCode } from './email/login-code';

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
