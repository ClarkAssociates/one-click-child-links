/**
 * Interface for Azure DevOps Dialog Service
 */
export default interface IAzureDevOpsDialogService {
  /**
   * Sends a dialog message
   * @param message The message to send.
   * @returns void
   */
  SendDialogMessage(message: string): void;

  /**
   * Sends a dialog message indicating an error occurred.
   * @returns void
   */
  SendErrorOccurredMessage(): void;
}
