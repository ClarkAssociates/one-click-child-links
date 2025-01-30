import { IGlobalDialog, IGlobalMessagesService } from "azure-devops-extension-api/Common/CommonServices";
import IAzureDevOpsDialogService from "./IAzureDevOpsDialogService";

export default class AzureDevOpsDialogService implements IAzureDevOpsDialogService {
  private readonly dialogService: IGlobalMessagesService;

  constructor({ dialogService }: { dialogService: IGlobalMessagesService }) {
    this.dialogService = dialogService;
  }

  SendDialogMessage(message: string): void {
    const dialog: IGlobalDialog = {
      title: "1-Click Child-Links",
      message,
      contentProperties: {
        width: 300,
        height: 200,
        resizable: false,
      },
    };

    this.dialogService.addDialog(dialog);
  }

  SendErrorOccurredMessage(): void {
    const dialog: IGlobalDialog = {
      title: "1-Click Child-Links",
      message: "An error occurred while creating child links. See the console for more details.",
      contentProperties: {
        width: 300,
        height: 200,
        resizable: false,
      },
    };

    this.dialogService.addDialog(dialog);
  }
}
