import { faker } from "@faker-js/faker";
import { mock } from "jest-mock-extended";
import { IGlobalMessagesService } from "azure-devops-extension-api/Common/CommonServices";
import AzureDevOpsDialogService from "./AzureDevOpsDialogService";

const getMocks = () => {
  const dialogService = mock<IGlobalMessagesService>();
  const basicDialogOptions = {
    title: "1-Click Child-Links",
    contentProperties: {
      width: 300,
      height: 200,
      resizable: false,
    },
  };

  return { dialogService, basicDialogOptions };
};

describe("AzureDevOpsDialogService", () => {
  it("creates an instance of AzureDevOpsDialogService", () => {
    const mocks = getMocks();
    const azureDevOpsDialogService = new AzureDevOpsDialogService(mocks);

    expect(azureDevOpsDialogService).toBeInstanceOf(AzureDevOpsDialogService);
  });

  describe("SendDialogMessage", () => {
    it("should send a dialog message", () => {
      const mocks = getMocks();
      const azureDevOpsDialogService = new AzureDevOpsDialogService(mocks);

      const message = faker.lorem.sentence();
      azureDevOpsDialogService.SendDialogMessage(message);

      expect(mocks.dialogService.addDialog).toHaveBeenCalledWith({
        title: mocks.basicDialogOptions.title,
        message,
        contentProperties: mocks.basicDialogOptions.contentProperties,
      });
    });
  });

  describe("SendErrorOccurredMessage", () => {
    it("should send an error dialog message", () => {
      const mocks = getMocks();
      const azureDevOpsDialogService = new AzureDevOpsDialogService(mocks);

      azureDevOpsDialogService.SendErrorOccurredMessage();

      expect(mocks.dialogService.addDialog).toHaveBeenCalledWith({
        title: mocks.basicDialogOptions.title,
        message: "An error occurred while creating child links. See the console for more details.",
        contentProperties: mocks.basicDialogOptions.contentProperties,
      });
    });
  });
});
