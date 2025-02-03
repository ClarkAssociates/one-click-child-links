export type WorkItem = {
  /**
   * Map of field and values for the work item.
   */
  fields: Record<string, unknown>;
  /**
   * The work item ID.
   */
  id: number;
  /**
   * REST URL for the resource.
   */
  url: string;
};
