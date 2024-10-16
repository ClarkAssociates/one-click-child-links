define(["TFS/WorkItemTracking/Services", "TFS/WorkItemTracking/RestClient", "TFS/Work/RestClient", "VSS/Controls", "VSS/Controls/StatusIndicator", "VSS/Controls/Dialogs"],
    function (_WorkItemServices, _WorkItemRestClient, workRestClient, Controls, StatusIndicator, Dialogs) {

        const currentWebContext = VSS.getWebContext();
        const witClient = _WorkItemRestClient.getClient();

        function replaceReferenceToParentField(fieldValue, currentWorkItem) {
            const filters = fieldValue.match(/[^{\}]+(?=})/g);
            if (filters) {
                fieldValue = filters.reduce((fieldValue, parentField) => fieldValue.replace('{' + parentField + '}', currentWorkItem[parentField]), fieldValue);
            }
            return fieldValue;
        }

        function replaceMacros(taskTemplate, currentWorkItem, teamSettings) {
            const macroList = {
                '@me': currentWebContext.user.uniqueName,
                '@currentiteration': teamSettings.backlogIteration.name + teamSettings.defaultIteration.path,
                '@assignedto': '{System.AssignedTo}',
                '@pairedwith': '',
            };

            if (currentWorkItem.fields['Custom.PairedWith']) {
                macroList['@pairedwith'] = '{Custom.PairedWith}';
            }

            return Object.fromEntries(
                Object.entries(taskTemplate.fields).map(([field, value]) => [
                    field,
                    Object.entries(macroList).reduce(
                        (fieldValue, [macro, replacement]) => fieldValue.replace(new RegExp(macro, 'gi'), replacement),
                        value
                    )
                ])
            );
        }

        function createWorkItemFromTemplate(currentWorkItem, taskTemplate, teamSettings) {
            const taskTemplateFields = replaceMacros(taskTemplate, currentWorkItem, teamSettings);

            // add the parent fields if they don't exist so they can be copied
            const fieldsToCopy = ['System.Title', 'System.AreaPath', 'System.IterationPath'];
            fieldsToCopy.forEach(field => {
                if (!taskTemplateFields[field]) {
                    taskTemplateFields[field] = '';
                }
            });

            const currentWorkItemFields = currentWorkItem.fields;

            let workItem = [];
            Object.entries(taskTemplateFields).forEach(([key, fieldValue]) => {
                if (taskTemplateFields.hasOwnProperty(key) && key.indexOf('System.Tags') < 0) {
                    const parentField = currentWorkItemFields[key] || '';
                    const valueToAdd = fieldValue ? replaceReferenceToParentField(fieldValue, currentWorkItemFields) : parentField;
                    if (valueToAdd) {
                        workItem.push({ "op": "add", "path": `/fields/${key}`, "value": valueToAdd });
                    }
                }
            });

            // add the current work item as a parent
            workItem.push({ op: "add", path: '/relations/-', value: { rel: "System.LinkTypes.Hierarchy-Reverse", url: currentWorkItem.url, attributes: { isLocked: false } } });

            return workItem;
        }

        async function createWorkItem(currentWorkItem, taskTemplate, teamSettings) {
            const newWorkItem = createWorkItemFromTemplate(currentWorkItem, taskTemplate, teamSettings);

            try {
                await witClient.createWorkItem(newWorkItem, currentWebContext.project.name, taskTemplate.workItemTypeName);
            } catch (error) {
                ShowDialog(" Error createWorkItem: " + JSON.stringify(error));
                WriteError("createWorkItem " + error);
            }
        }

        async function AddTasks(workItemId) {
            const workClient = workRestClient.getClient();

            const team = {
                projectId: currentWebContext.project.id,
                teamId: currentWebContext.team.id
            };

            const teamSettings = await workClient.getTeamSettings(team);
            let currentWorkItem = await witClient.getWorkItem(workItemId);

            currentWorkItem.fields['System.Id'] = workItemId;
            const workItemType = currentWorkItem.fields["System.WorkItemType"];

            const childTypes = await GetChildTypes(workItemType);
            if (childTypes == null) {
                return;
            }

            let templates = (await Promise.all(
                childTypes.map(workItemType =>
                    witClient.getTemplates(currentWebContext.project.id, currentWebContext.team.id, workItemType)
                ))
            ).flat();

            if (templates.length == 0) {
                ShowDialog('No ' + childTypes + ' templates found. Please add ' + childTypes + ' templates for the project team.');
                return;
            }
            templates = templates.sort(SortTemplates);

            const batchSize = 50; //max batch size to not overload ADO

            const templateBatches = [];
            for (let i = 0; i < templates.length; i += batchSize) {
                const batch = templates.slice(i, i + batchSize);
                templateBatches.push(batch);
            }

            for (const batch of templateBatches) {
                await Promise.all(batch.map(template => {
                    return createChildFromTemplate(currentWorkItem, template.id, teamSettings);
                }));
            }
            WriteTrace('Work items created successfully.');
            const navigationService = await VSS.getService(VSS.ServiceIds.Navigation);
            navigationService.reload();
        }

        async function createChildFromTemplate(currentWorkItem, id, teamSettings) {
            const taskTemplate = await witClient.getTemplate(currentWebContext.project.id, currentWebContext.team.id, id);
            if (IsValidTemplateWIT(currentWorkItem.fields, taskTemplate)) {
                if (IsValidTemplateTitle(currentWorkItem.fields, taskTemplate)) {
                    await createWorkItem(currentWorkItem, taskTemplate, teamSettings);
                }
            }
        }

        function IsValidTemplateWIT(currentWorkItemFields, taskTemplate) {

            WriteTrace("template: '" + taskTemplate.name + "'");

            // If not empty, does the description have the old square bracket approach or new JSON?
            const jsonFilters = extractJSON(taskTemplate.description)[0];
            if (IsJsonString(JSON.stringify(jsonFilters))) {
                // example JSON:
                //
                //   {
                //      "applywhen": [
                //        {
                //          "System.State": "Approved",
                //          "System.Tags" : ["Blah", "ClickMe"],
                //          "System.WorkItemType": "Product Backlog Item"
                //        },
                //        {
                //          "System.State": "Approved",
                //          "System.Tags" : ["Blah", "ClickMe"],
                //          "System.WorkItemType": "Product Backlog Item"
                //        }
                //         ]
                //    }

                WriteTrace("filter: '" + JSON.stringify(jsonFilters) + "'");

                let rules = jsonFilters.applywhen;
                if (!Array.isArray(rules))
                    rules = new Array(rules);

                const matchRule = rules.some(filters => {

                    const matchFilter = Object.keys(filters).every(function (prop) {

                        const matchfield = matchField(prop, currentWorkItemFields, filters);
                        WriteTrace(" - filter['" + prop + "'] : '" + filters[prop] + "' - wit['" + prop + "'] : '" + currentWorkItemFields[prop] + "' equal ? " + matchfield);
                        return matchfield
                    });

                    return matchFilter;
                });

                return matchRule;


            } else {
                const filters = taskTemplate.description.match(/[^[\]]+(?=])/g);

                if (filters) {
                    let isValid = false;
                    for (const filter of filters) {
                        let found = filter.split(',').find(function (f) { return f.trim().toLowerCase() == currentWorkItemFields["System.WorkItemType"].toLowerCase() });
                        if (found) {
                            isValid = true;
                            break;
                        }
                    }
                    return isValid;
                } else {
                    return true;
                }
            }
        }

        function matchField(fieldName, currentWorkItemFields, filterObject) {
            try {
                if (currentWorkItemFields[fieldName] == null)
                    return false;

                if (typeof (filterObject[fieldName]) === "undefined")
                    return false;

                // convert it to array for easy compare
                let filterValue = filterObject[fieldName];
                if (!Array.isArray(filterValue))
                    filterValue = new Array(String(filterValue));

                let currentWorkItemValue = currentWorkItemFields[fieldName];
                if (fieldName == "System.Tags") {
                    currentWorkItemValue = currentWorkItemFields[fieldName].split("; ");
                }
                else if (!Array.isArray(currentWorkItemValue)) {
                        currentWorkItemValue = new Array(String(currentWorkItemValue));
                }


                const match = filterValue.some(i => {
                    return currentWorkItemValue.findIndex(c => i.toLowerCase() === c.toLowerCase()) >= 0;
                })

                return match;
            }
            catch (e) {
                WriteError('matchField ' + e);
                return false;
            }

        }

        function IsValidTemplateTitle(currentWorkItemFields, taskTemplate) {
            const jsonFilters = extractJSON(taskTemplate.description)[0];
            const isJSON = IsJsonString(JSON.stringify(jsonFilters));
            if (isJSON) {
                return true;
            }
            const filters = taskTemplate.description.match(/[^{\}]+(?=})/g);
            const curTitle = currentWorkItemFields["System.Title"].match(/[^{\}]+(?=})/g);
            if (filters) {
                let isValid = false;
                if (curTitle) {
                    for (const filter of filters) {
                        if (curTitle.indexOf(filter) > -1) {
                            isValid = true;
                            break;
                        }
                    }
                }
                return isValid;
            } else {
                return true;
            }

        }

        function findWorkTypeCategory(categories, workItemType) {
            for (const category of categories) {
                const found = category.workItemTypes.find(function (w) { return w.name == workItemType; });
                if (found) {
                    return category;
                }
            }
        }

        async function GetChildTypes(workItemType) {
            const categories = await witClient.getWorkItemTypeCategories(currentWebContext.project.name);
            const category = findWorkTypeCategory(categories, workItemType);

            if (category) {
                const requests = [];
                const workClient = workRestClient.getClient();

                const team = {
                    projectId: currentWebContext.project.id,
                    teamId: currentWebContext.team.id
                };

                const bugsBehavior = workClient.getTeamSettings(team).bugsBehavior; //Off, AsTasks, AsRequirements

                if (category.referenceName === 'Microsoft.EpicCategory') {
                    const category = await witClient.getWorkItemTypeCategory(currentWebContext.project.name, 'Microsoft.FeatureCategory');
                    return category.workItemTypes.map(item => item.name);
                } else if (category.referenc) {
                    requests.push(witClient.getWorkItemTypeCategory(currentWebContext.project.name, 'Microsoft.RequirementCategory'));
                    if (bugsBehavior === 'AsRequirements') {
                        requests.push(witClient.getWorkItemTypeCategory(currentWebContext.project.name, 'Microsoft.BugCategory'));
                    }
                } else if (category.referenceName === 'Microsoft.RequirementCategory') {
                    requests.push(witClient.getWorkItemTypeCategory(currentWebContext.project.name, 'Microsoft.TaskCategory'));
                    requests.push(witClient.getWorkItemTypeCategory(currentWebContext.project.name, 'Microsoft.TestCaseCategory'));
                    if (bugsBehavior === 'AsTasks') {
                        requests.push(witClient.getWorkItemTypeCategory(currentWebContext.project.name, 'Microsoft.BugCategory'));
                    }
                } else if (category.referenceName === 'Microsoft.BugCategory' && bugsBehavior === 'AsRequirements') {
                    requests.push(witClient.getWorkItemTypeCategory(currentWebContext.project.name, 'Microsoft.TaskCategory'));
                } else if (category.referenceName === 'Microsoft.TaskCategory') {
                    requests.push(witClient.getWorkItemTypeCategory(currentWebContext.project.name, 'Microsoft.TaskCategory'));
                } else if (category.referenceName == 'Microsoft.BugCategory') {
                    requests.push(witClient.getWorkItemTypeCategory(currentWebContext.project.name, 'Microsoft.TaskCategory'));
                }
                const categoriesReturned = await Promise.all(requests);
                return categoriesReturned.map(category => category.workItemTypes.map(workItemType => workItemType.name));
            }
        }

        async function ShowDialog(message) {

            const dialogOptions = {
                title: "1-Click Child-Links",
                width: 300,
                height: 200,
                resizable: false,
            };

            const dialogSvc = await VSS.getService(VSS.ServiceIds.Dialog);

            const dialog = await dialogSvc.openMessageDialog(message, dialogOptions);
        }

        function SortTemplates(a, b) {
            const nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase();
            if (nameA < nameB) //sort string ascending
                return -1;
            if (nameA > nameB)
                return 1;
            return 0; //default return value (no sorting)
        }

        function WriteTrace(msg) {
            console.log('1-Click Child-Links: ' + msg);
        }

        function WriteLog(msg) {
            console.log('1-Click Child-Links: ' + msg);
        }

        function WriteError(msg) {
            console.error('1-Click Child-Links: ' + msg);
        }

        function extractJSON(str) {
            let firstOpen, firstClose, candidate;
            firstOpen = str.indexOf('{', firstOpen + 1);

            if (firstOpen != -1) {
                do {
                    firstClose = str.lastIndexOf('}');

                    if (firstClose <= firstOpen) {
                        return null;
                    }
                    do {
                        candidate = str.substring(firstOpen, firstClose + 1);

                        try {
                            const res = JSON.parse(candidate);

                            return [res, firstOpen, firstClose + 1];
                        }
                        catch (e) {
                            WriteError('extractJSON ...failed ' + e);
                        }
                        firstClose = str.substr(0, firstClose).lastIndexOf('}');
                    } while (firstClose > firstOpen);
                    firstOpen = str.indexOf('{', firstOpen + 1);
                } while (firstOpen != -1);
            } else { return ''; }
        }

        function IsJsonString(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        }

        return {
            create: async function (context) {
                WriteLog('init v0.12.2');

                const service = await _WorkItemServices.WorkItemFormService.getService();
                const hasActiveWorkItem = await service.hasActiveWorkItem();

                if (hasActiveWorkItem) {
                    const workItemId = await service.getId();
                    await AddTasks(workItemId);
                } else if (context.workItemIds && context.workItemIds.length > 0) {
                    await Promise.all(context.workItemIds.map(workItemId => AddTasks(workItemId)));
                } else if (context.id) {
                    await AddTasks(context.id);
                }
            },
        }
    });
