/**
 * Represents the Azure DevOps team settings.
 */
export type TeamSettings = {
  iterationInformation: {
    backlogIterationName: string;
    defaultIterationPath: string;
  };
};

/**
 * Represents the Azure DevOps project context.
 */
export type ProjectContext = {
  name: string;
  id: string;
};

/**
 * Represents the Azure DevOps team context.
 */
export type TeamContext = {
  name: string;
  id: string;
};

/**
 * Represents the Azure DevOps user context.
 */
export type UserContext = {
  name: string;
  id: string;
};

/**
 * Represents the Azure DevOps context.
 * This includes the current project, team, and user.
 */
export interface IAzureDevOpsContext {
  project: ProjectContext;
  team: TeamContext;
  user: UserContext;

  /**
   * Get the team settings for the current context.
   * @returns The team settings.
   */
  getTeamSettings(): Promise<TeamSettings>;
}
