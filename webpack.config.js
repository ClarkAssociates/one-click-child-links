const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const devRevisionVersion = Math.floor(new Date().getTime() / 1000);

const sourceDirectory = "src";
const distDirectory = "dist";
const distAbsoluteDirectory = path.resolve(__dirname, distDirectory);

const tfxEnvironment = process.env.TFX_ENV || "";

const computeDistPath = ({ absoluteFilename }) => {
    const pathSegments = absoluteFilename.split(path.sep);

    const sourceDirectoryIndex = pathSegments.indexOf(sourceDirectory);
    if (sourceDirectoryIndex < 0) {
      throw new Error("Could not find source directory from path");
    }

    const relativePathSegments = pathSegments.slice(sourceDirectoryIndex + 1);

    return path.join(distAbsoluteDirectory, ...relativePathSegments);
};

const getDevId = (name, fullName = false) => `${name}-${fullName ? "develop" : "dev"}`;
const getDevDisplayName = (name) => `${name} (Develop)`;

module.exports = {
    entry: {},
    optimization: {
        minimize: false,
    },
    output: {
        path: distAbsoluteDirectory,
        clean: true,
    },
    devtool: "inline-source-map",
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js'),
                    to: path.resolve(__dirname, 'dist/lib')
                },
                {
                    from: `${sourceDirectory}/scripts/*.js`,
                    to: computeDistPath
                },
                {
                    from: `${sourceDirectory}/images/**/*.png`,
                    to: computeDistPath
                },
                {
                    from: `${sourceDirectory}/*.html`,
                    to: computeDistPath
                },
                {
                    from: `${sourceDirectory}/*.md`,
                    to: computeDistPath
                },
                {
                    from: `${sourceDirectory}/vss-extension.json`,
                    to: computeDistPath,
                    transform: (content) => {
                      const data = JSON.parse(content.toString());
                      let devData = {};

                      if (tfxEnvironment === "DEV") {
                        const [devMajorVersion, devMinorVersion, devPatchVersion] = data.version.split(".");

                        devData = {
                          version: [devMajorVersion, devMinorVersion, devPatchVersion, devRevisionVersion].join("."),
                          id: getDevId(data.id, true),
                          name: getDevDisplayName(data.name),
                          contributions: data.contributions.map((contribution) => {
                            if (contribution.type === "ms.vss-endpoint.service-endpoint-type") {
                              return {
                                ...contribution,
                                id: getDevId(contribution.id),
                                properties: {
                                  ...contribution.properties,
                                  name: getDevId(contribution.properties.name),
                                  displayName: getDevDisplayName(contribution.properties.displayName),
                                },
                              };
                            }

                            return contribution;
                          }),
                        };
                      }

                      return JSON.stringify(
                        {
                          ...data,
                          ...devData,
                        },
                        null,
                        2
                      );
                    },
                  },
            ]
        })
    ]
};
