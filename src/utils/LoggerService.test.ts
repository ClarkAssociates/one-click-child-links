/* eslint-disable no-console */
import { faker } from "@faker-js/faker";
import LoggerService from "./LoggerService";

const getMocks = () => {
  console.info = jest.fn();
  console.log = jest.fn();
  console.error = jest.fn();

  const messageHeader = "1-Click Child-Links:";
  const message = faker.lorem.sentence();

  return {
    messageHeader,
    message,
  };
};

describe("AzureDevOpsContext", () => {
  it("should create an instance of LoggerService", () => {
    const loggerService = new LoggerService();
    expect(loggerService).toBeInstanceOf(LoggerService);
  });

  it("should write a trace message", () => {
    const mocks = getMocks();
    const loggerService = new LoggerService();

    loggerService.writeTrace(mocks.message);
    expect(console.info).toHaveBeenCalledWith(`${mocks.messageHeader} ${mocks.message}`);
  });

  it("should write a log message", () => {
    const mocks = getMocks();
    const loggerService = new LoggerService();

    loggerService.writeLog(mocks.message);
    expect(console.log).toHaveBeenCalledWith(`${mocks.messageHeader} ${mocks.message}`);
  });

  it("should write an error stack when given an Error", () => {
    const mocks = getMocks();
    const loggerService = new LoggerService();

    const error = new Error(mocks.message);

    loggerService.writeError(error);
    expect(console.error).toHaveBeenCalledWith(`${mocks.messageHeader} ${error.stack}`);
  });

  it("should write an error message", () => {
    const mocks = getMocks();
    const loggerService = new LoggerService();

    loggerService.writeError(mocks.message);
    expect(console.error).toHaveBeenCalledWith(`${mocks.messageHeader} ${mocks.message}`);
  });
});
