import { Template } from "../common/templates";
import { WorkItem } from "../common/workitem";
import { IAzureDevOpsContext } from "../utils/IAzureDevOpsContext";
import IChildTemplateCreationService from "./IChildTemplateCreationService";

export default class ChildTemplateCreationService implements IChildTemplateCreationService {
  /**
   * The custom macros to use in the child template creation.
   */
  private readonly macros: Record<string, string>;

  constructor(macros: Record<string, string>) {
    this.macros = macros;
  }

  static async getChildTemplateCreationService(currentContext: IAzureDevOpsContext): Promise<IChildTemplateCreationService> {
    const teamSettings = await currentContext.getTeamSettings();

    const macroList: Record<string, string> = {
      "@me": currentContext.user.id,
      "@currentiteration": teamSettings.iterationInformation.backlogIterationName + teamSettings.iterationInformation.defaultIterationPath,
      "@assignedto": "{System.AssignedTo}",
      "@pairedwith": "",
    };

    return new ChildTemplateCreationService(macroList);
  }

  createChildTemplate(template: Template, currentWorkItem: WorkItem): Template {
    const templateWithoutReferences = this.replaceReferences(template, currentWorkItem);

    const childTemplate = this.ensureValidFields(templateWithoutReferences, currentWorkItem);

    return childTemplate;
  }

  /**
   * Replaces the references in the template with the values from the current work item.
   * @param template The template to replace the references in.
   * @param currentWorkItem The current work item.
   * @returns The template with the references replaced.
   */
  private replaceReferences(template: Template, currentWorkItem: WorkItem): Template {
    const macroList = this.macros;
    if (currentWorkItem.fields["Custom.PairedWith"]) {
      macroList["@pairedwith"] = "{Custom.PairedWith}";
    }

    const fields = Object.fromEntries(
      Object.entries(template.fields).map(([fieldName, fieldValue]) => [fieldName, replaceValues(fieldValue, currentWorkItem, macroList)])
    );

    return {
      ...template,
      fields,
    };

    function replaceValues(templateValue: unknown, currentWorkItem: WorkItem, macroList: Record<string, string>): unknown {
      if (typeof templateValue !== "string") {
        return templateValue;
      }

      const replacedMacrosValue = templateValue.replace(
        new RegExp(Object.keys(macroList).join("|"), "gi"),
        (matched) => macroList[matched]
      );

      return replacedMacrosValue.replace(/{([^{}]+)}/g, (parentField) => {
        const parentFieldKey = parentField.slice(1, -1); // remove the curly braces

        const parentValue = currentWorkItem.fields[parentFieldKey];

        if (typeof parentValue === "string") {
          return parentValue;
        }
        if (typeof parentValue === "object" && parentValue !== null && "displayName" in parentValue) {
          return String(parentValue?.displayName);
        }
        return "";
      });
    }
  }

  /**
   * Ensures required fields are added and invalid fields are removed from the template.
   * @param template The template to update.
   * @param currentWorkItem The current work item.
   * @returns The updated template.
   */
  private ensureValidFields(template: Template, currentWorkItem: WorkItem): Template {
    const fieldsToCopy = ["System.Title", "System.AreaPath", "System.IterationPath"];
    const templateToValidate = template;

    fieldsToCopy.forEach((field) => {
      if (!templateToValidate.fields[field]) {
        templateToValidate.fields[field] = currentWorkItem.fields[field];
      }
    });

    // add the template tags to the work item correctly
    if (templateToValidate.fields["System.Tags-Add"]) {
      templateToValidate.fields["System.Tags"] = template.fields["System.Tags-Add"];
      delete templateToValidate.fields["System.Tags-Add"];
    }
    delete templateToValidate.fields["System.Tags-Remove"];

    return templateToValidate;
  }
}
