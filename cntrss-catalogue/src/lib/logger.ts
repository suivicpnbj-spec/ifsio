import { inspect } from 'node:util';

// Journal structuré (une ligne JSON par événement) partagé par le serveur,
// l'authentification et l'envoi de mails. Module serveur uniquement.

export function structuredLog(
  level: 'info' | 'warn' | 'error',
  event: string,
  payload?: Record<string, unknown>
): void {
  const line = JSON.stringify({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...(payload ?? {})
  });

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

/** Journalise une erreur sans jamais la faire échouer l'appelant. */
export function logError(event: string, err: unknown, extra?: Record<string, unknown>): void {
  structuredLog('error', event, {
    error: err instanceof Error ? err.message : inspect(err),
    ...(extra ?? {})
  });
}
