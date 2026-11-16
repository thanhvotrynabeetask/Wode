import { formatLogTimestamp } from '../utils/dateFormat';
import { LOG_LEVELS } from '../utils/constants';

type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
}

export class LoggerService {
  private static inMemoryLogs: LogEntry[] = [];
  private static onLogListeners: ((entry: LogEntry) => void)[] = [];

  public static log(level: LogLevel, moduleName: string, message: string): void {
    const timestamp = formatLogTimestamp();
    const entry: LogEntry = {
      timestamp,
      level,
      module: moduleName,
      message,
    };

    this.inMemoryLogs.push(entry);
    // Keep max 1000 in-memory logs
    if (this.inMemoryLogs.length > 1000) {
      this.inMemoryLogs.shift();
    }

    // Notify listeners (such as FileSystemService sync)
    this.onLogListeners.forEach((fn) => fn(entry));

    // Also output formatted string to browser console for development
    const formatted = `[${timestamp}] [${level}] [${moduleName}] - ${message}`;
    if (level === 'ERROR') {
      console.error(formatted);
    } else if (level === 'WARN') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  public static info(moduleName: string, message: string): void {
    this.log(LOG_LEVELS.INFO, moduleName, message);
  }

  public static warn(moduleName: string, message: string): void {
    this.log(LOG_LEVELS.WARN, moduleName, message);
  }

  public static error(moduleName: string, message: string): void {
    this.log(LOG_LEVELS.ERROR, moduleName, message);
  }

  public static getFormattedLogs(): string {
    return this.inMemoryLogs
      .map((e) => `[${e.timestamp}] [${e.level}] [${e.module}] - ${e.message}`)
      .join('\n');
  }

  public static onNewLog(callback: (entry: LogEntry) => void): () => void {
    this.onLogListeners.push(callback);
    return () => {
      this.onLogListeners = this.onLogListeners.filter((cb) => cb !== callback);
    };
  }
}
