import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { SCHEMA_SQL } from './schema'

export type SqlValue = string | number | bigint | null | Uint8Array

/**
 * `node:sqlite` n'accepte que ces types : on convertit donc les booléens et
 * les valeurs `undefined` avant chaque exécution.
 */
function normalize(value: unknown): SqlValue {
  if (value === undefined || value === null) return null
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'string') {
    return value
  }
  if (value instanceof Uint8Array) return value
  return JSON.stringify(value)
}

export class Database {
  readonly handle: DatabaseSync

  constructor(filename: string) {
    if (filename !== ':memory:') {
      mkdirSync(path.dirname(filename), { recursive: true })
    }
    this.handle = new DatabaseSync(filename)
    this.handle.exec('PRAGMA journal_mode = WAL;')
    this.handle.exec('PRAGMA foreign_keys = ON;')
    this.handle.exec(SCHEMA_SQL)
  }

  exec(sql: string): void {
    this.handle.exec(sql)
  }

  run(sql: string, ...params: unknown[]): { changes: number; lastInsertRowid: number } {
    const statement = this.handle.prepare(sql)
    const result = statement.run(...params.map(normalize))
    return {
      changes: Number(result.changes),
      lastInsertRowid: Number(result.lastInsertRowid),
    }
  }

  get<T>(sql: string, ...params: unknown[]): T | undefined {
    const statement = this.handle.prepare(sql)
    return statement.get(...params.map(normalize)) as T | undefined
  }

  all<T>(sql: string, ...params: unknown[]): T[] {
    const statement = this.handle.prepare(sql)
    return statement.all(...params.map(normalize)) as T[]
  }

  transaction<T>(callback: () => T): T {
    this.handle.exec('BEGIN')
    try {
      const result = callback()
      this.handle.exec('COMMIT')
      return result
    } catch (error) {
      this.handle.exec('ROLLBACK')
      throw error
    }
  }

  close(): void {
    this.handle.close()
  }
}
