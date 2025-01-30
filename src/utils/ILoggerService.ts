export default interface ILoggerService {
  /**
   * Writes a trace message to the log.
   * @param message The message to write to the log.
   */
  writeTrace(message: string): void;
  /**
   * Writes a log message to the log.
   * @param message The message to write to the log.
   */
  writeLog(message: string): void;
  /**
   * Writes an error message to the log.
   * @param error The error to display in the log.
   */
  writeError(error: Error | string): void;
}
