# Dependency management

This project uses [yarn v3](https://yarnpkg.com/) to manage its dependencies. It uses workspaces[https://yarnpkg.com/features/workspaces] functionality to manage the monorepo.

## Working with sub-packages

In this context, a 'sub-package' is any package of the monorepo. That includes `./packages/*`, `./client` and `./apps/*`.

With `yarn`, there are two different modes to work with a sub-package:

**Option 1**: Go to the directory that contains the package and run regular yarn commands. Example:

```
cd packages/calypso-analytics
yarn add ...
```

**Option 2**: Run `yarn` commands in teh root of the project, but prepend `workspace <packageName>`. Example

```
yarn workspace @automattic/calypso-analytics add...
```

Both options are equivalent, is a matter of personal preference. For the rest of this guide, the examples will follow Option 1.

## Common tasks

### Add a new dependency

```
cd <package-dir>
yarn add <dependency>

# Example:
# cd packages/calypso-analytics
# yarn add lodash
```

You should add dependencies to the root project _only_ when it will be used to test and/or build other packages. To do this, run:

```
yarn add -w <dependency>
```

#### Unpublished package as a dependency

Sometimes you'll want to [create a package](https://github.com/Automattic/wp-calypso/blob/HEAD/docs/guide/monorepo.md#a-sample-packagejson) and use it as another workspace's dependency before it's published. To add such dependency, make sure you **specify its exact version** because otherwise, `yarn` will try to resolve it from the `npm` registry and throw the `Not found` error.

Let's say you created a polyfill package and want to add it as a dependency to `packages/calypso-polyfills`. Doing this will make `yarn` resolve to your fresh (unpublished) package and install it as a symlink:

```
cd packages/calypso-polyfills
yarn add @automattic/my-awesome-polyfill@1.0.0
```

That's it! Don't forget to [publish the package](https://github.com/Automattic/wp-calypso/blob/HEAD/docs/guide/monorepo.md#publishing) after merging your PR!

### Delete a dependency

```
cd <package-dir>
yarn remove <dependency>

# Example:
# cd packages/calypso-analytics
# yarn remove lodash
```

To delete a dependency of the root project, run:

```
yarn remove -w lodash
```

### Update a dependency

Run

```
yarn up <package>

# Example
# yarn up react-query
```

Note that this won't change the required range of `react-query` (i.e. it won't modify `package.json`). Instead, it will try to update `react-query` and any of its dependencies to the highest version that satisfies the specified range.
For example, if we declare a dependency on `react-query@^2.24.0` it may update react-query to `2.24.1`, but never to `3.0.0`.

### Update a dependency to a new range

Run

```
yarn up <package>@^<semver-range>

# Example
# yarn up react-query@^3.0.0
```

As before, it will update `react-query` and all its dependencies. But in this case, it _will_ change the required range (i.e. it will modify `package.json`)

### List oudated dependencies

Run

```
yarn outdated
```

Note that the output includes which sub-package has the dependency. It is possible that the same dependency is present in many sub-packages (or even in the root project).

### List duplicated dependencies

Run

```
yarn dedupe --check
```

It is recommended to run this command after adding a new dependency and fix potential duplications with `yarn dedupe`

## Differences with `npm`

### Running scripts

When working with `yarn` we don't have to specify `run` in the command line:

```
# Before:
npm run build-client

# After:
yarn build-client
```

### Other

Check the [official documentation](https://classic.yarnpkg.com/en/docs/migrating-from-npm/#toc-cli-commands-comparison) to see more equivalences between `npm` and `yarn` commands.
