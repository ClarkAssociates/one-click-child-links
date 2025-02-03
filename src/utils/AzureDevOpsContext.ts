import { getUser, getWebContext } from "azure-devops-extension-sdk";
import { IAzureDevOpsContext, ProjectContext, TeamContext, TeamSettings, UserContext } from "./IAzureDevOpsContext";
import { getADOTeamSettings } from "./utils";

export default class AzureDevOpsContext implements IAzureDevOpsContext {
  readonly project: ProjectContext;

  readonly team: TeamContext;

  readonly user: UserContext;

  constructor() {
    const webContext = getWebContext();
    this.project = {
      name: webContext.project.name,
      id: webContext.project.id,
    };
    this.team = {
      name: webContext.team.name,
      id: webContext.team.id,
    };

    const user = getUser();
    this.user = {
      name: user.name,
      id: user.id,
    };
  }

  async getTeamSettings(): Promise<TeamSettings> {
    const teamSettings = await getADOTeamSettings(this.team, this.project);

    return {
      iterationInformation: {
        backlogIterationName: teamSettings.backlogIteration.name,
        defaultIterationPath: teamSettings.defaultIteration.path,
      },
    };
  }
}
