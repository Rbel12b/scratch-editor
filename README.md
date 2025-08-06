# scratch-editor: SAM Scratch Monorepo

## What's in this repository?

The `packages` directory in this repository contains:

- `scratch-gui` provides the buttons, menus, and other elements that you interact with when creating and editing a
  project. It's also the "glue" that brings most of the other modules together at runtime.
- `scratch-vm` is the virtual machine that runs Scratch projects.
- `scratch-samlabs` extension
- `scratch-BabySamBot` extension
- `scratch-huskylens` extension 

Each package has its own `README.md` file with more information about that package.

## Building

to install dependencies and setup the development environment run
```
npm install 
npm run setup-dev
```

then build the scratch-gui package
```
npm run build:dev # for development
NODE_ENV=production npm run build # production build
```

### Development 

`npm run watch` and `npm run start` can be used to build the project when changes occur (the `start` command serves the built application on [localhost:8601](http://localhost:8601)
