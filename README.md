# microservice-tracing-example

trace a request through a configurable backend and view potential bottlenecks/issues based on the graph of the services

![UI](/static/nodes.gif)

The organization of the nodes and the time-per-node is configured on the left of the UI. 

All packages can be installed with `yarn install` in the root of the project (after running `nvm use` to select the appropriate node version). The backend and frontend workspaces need to be kicked off with `yarn start`.

The UI allows a creation of an arbitrary (except single entry point) directed acyclic graph of nodes which dynamically spins up several linked express servers that do an a set amount of "work" (aka sleeping) before calling down stream services and eventually returning their outputs.
