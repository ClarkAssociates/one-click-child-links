/* eslint-disable no-console */
import ILoggerService from "./ILoggerService";

export default class LoggerService implements ILoggerService {
  private static readonly header = "1-Click Child-Links:";

  writeTrace(message: string): void {
    console.info(`${LoggerService.header} ${message}`);
  }

  writeLog(message: string): void {
    console.log(`${LoggerService.header} ${message}`);
  }

  writeError(error: Error | string): void {
    if (error instanceof Error) {
      console.error(`${LoggerService.header} ${error.stack}`);
    } else {
      console.error(`${LoggerService.header} ${error}`);
    }
  }
}
