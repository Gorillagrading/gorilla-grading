import type { Db } from '../db/client.js';
import type { UserDto } from '../shared/auth.js';
import type { SendLoginCode } from './email/login-code.js';
import type { SendMail } from './email/transport.js';
import type { ObjectStorage } from './storage.js';

/** Dependencias que se inyectan al crear la app, para poder sustituirlas en las pruebas. */
export type Deps = {
  getDb: () => Db;
  sendLoginCode: SendLoginCode;
  sendMail: SendMail;
  storage: ObjectStorage;
};

export type AppEnv = {
  Variables: {
    requestId: string;
    user: UserDto;
  };
};
