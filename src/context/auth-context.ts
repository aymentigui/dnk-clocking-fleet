// context/auth-context.ts
import { AsyncLocalStorage } from 'async_hooks';

type AuthContextType = {
  user: any; // tu peux typé ça mieux si tu veux
};

const authContext = new AsyncLocalStorage<AuthContextType>();

export default authContext;
