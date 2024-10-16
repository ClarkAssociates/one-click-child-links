Azure DevOps Extension for boards that allows users to create and apply templates for creating work item child tasks based on properties of the work item.

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
