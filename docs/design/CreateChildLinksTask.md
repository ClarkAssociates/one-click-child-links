# Create Child Links Task

## Overview

The purpose of this task is to create child tasks based on the templates that are provided by the user's team. The task will create a new task for each template that is provided by the user. The task will also set the parent-child relationship between the parent and the child.

## Inputs

- `workItemIds` (number[]): The workItem Id(s) for the parent items selected by the user.

## Outputs

- `success`: A message is displayed to the user if the child tasks are created successfully.
- `errorMessage`: A message is displayed to the user to indicate that the child tasks could not be created and to check the logs for more information.

## Class Diagrams

```mermaid
classDiagram
  class WorkItem{
    <<record>>
    +record fields
    +number id
    +string url
  }

  class TemplateReference{
    <<record>>
    +string name
    +string id
    +string description
    +string workItemTypeName
  }

  class ITemplateFilter{
    <<Interface>>
    +filterTemplateReferences()
  }

  class IWorkItemService {
    <<Interface>>
    +createWorkItemFromTemplate()
    +getChildTemplateReferences()
    +getTemplates()
    +getWorkItem()
  }

  class IChildTemplateCreationService{
    <<Interface>>
    +createChildTemplate()
  }

  class IAzureDevOpsContext{
    <<Interface>>
    +getTeamSettings()
  }

  class IAzureDevOpsDialogService{
    <<Interface>>
    +SendDialogMessage()
    +SendErrorOccurredMessage()
  }

  class ILoggerService{
    <<Interface>>
    +writeTrace()
    +writeLog()
    +writeError()
  }

  class IWorkItemClient{
    <<Interface>>
    +createWorkItem()
    +getWorkItem()
    +getWorkItemTypes()
    +getTemplate()
    +getTemplates()
  }

  class CreateChildLinksTask{
    +ctor(IWorkItemClient workItemClient, ILoggerService loggerService, ITemplateService templateService, ITemplateFilter templateFilter, IChildTemplateCreationService childTemplateCreationService)
    +runTask(string workItemId)
  }

  CreateChildLinksTask --> ILoggerService
  CreateChildLinksTask --> IWorkItemService
  CreateChildLinksTask --> ITemplateFilter
  CreateChildLinksTask --> IChildTemplateCreationService

  IWorkItemService --> IWorkItemClient
```

## Sequence Diagram

```mermaid
sequenceDiagram
  participant task
  participant WIS as IWorkItemService
  participant TF as ITemplateFilter
  participant CTCS as IChildTemplateCreationService

  task ->> WIS: getworkitem() (gets the parent workitem)
  WIS ->> task: workitem

  task ->> WIS: getChildTemplateReferences()
  WIS ->> task: templateReferences

  task ->> TF: filterTemplateReferences()
  TF ->> task: filterTemplates

  loop filterTemplates
    task ->> WIS: getTemplate()
    WIS ->> task: template

    task ->> CTCS: createChildTemplate()
    CTCS ->> task: childTemplate

    task ->> WIS: createWorkItemFromTemplate()
    WIS ->> task: workItem
  end
```