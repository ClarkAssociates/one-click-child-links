import { faker } from "@faker-js/faker";
import AzureDevOpsContext from "./AzureDevOpsContext";

jest.mock("azure-devops-extension-sdk", () => ({
  getUser: jest.fn().mockReturnValue({ name: faker.lorem.slug(), id: faker.lorem.slug() }),
  getWebContext: jest.fn().mockReturnValue({
    project: { name: faker.lorem.slug(), id: faker.lorem.slug() },
    team: { name: faker.lorem.slug(), id: faker.lorem.slug() },
  }),
}));

jest.mock("./utils", () => ({
  getADOTeamSettings: jest.fn().mockResolvedValue({
    backlogIteration: { name: faker.system.directoryPath() },
    defaultIteration: { path: faker.system.directoryPath() },
  }),
}));

describe("AzureDevOpsContext", () => {
  it("should create an instance of AzureDevOpsContext", () => {
    const azureDevOpsContext = new AzureDevOpsContext();
    expect(azureDevOpsContext).toBeInstanceOf(AzureDevOpsContext);
  });

  it("should get team settings", async () => {
    const azureDevOpsContext = new AzureDevOpsContext();
    const teamSettings = await azureDevOpsContext.getTeamSettings();
    expect(teamSettings).toBeDefined();
  });
});
