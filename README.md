One-Click-Child-Links is an Azure DevOps extension that allows you to create child work items with a single click. This extension is useful when you have many tasks to create for a work item and you want to automate the process.

This repo is a downstream fork of figueiredorui's [1-click-child-links Github repo](https://github.com/figueiredorui/1-click-child-links/tree/master).

## Build

To build the extension for release:

```bash
yarn
yarn build
yarn package
```

The vsix will be published to the `dist` directory in the project root.

## Local Testing

To build the extension for dev before packaging the vsix, use `yarn build:dev`. This will make the patch version based on the current time so that you can test the extension multiple times without worrying about version conflicts.

## SDK version issues

Broke the SDK init in 3.1.3 and later latest version is 4.0.2