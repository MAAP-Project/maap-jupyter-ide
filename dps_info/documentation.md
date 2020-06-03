## DPS Info Extension Documentation & Architecture
### Architecture
<img alt="architecture diagram" src="dps_info_architecture.png" width="350">

#### sourcefiles
- index.ts: instantiate & export jupyter extensions
- activate.ts: contains all extension activate functions
- panel.ts: contains skeleton code for a basic side panel in jupyter lab, wth a commented-out example activate function (extension must be instantiated and exported as well)
- jobinfo.ts: 1) creates a widget for listing DPS jobs associated with the user in table; 2) creates a main area jupyter widget for easy UI in listing, describing, and executing algorithms; (1) and (2) are NOT synchronized; the table in (1) is organized as:

| Job Id | Status | Algorithm |
| ------ | ------ | --------- |

- funcs.ts: common functions across classes & API calls in jobinfo.ts
- request.ts: class and functions utility for making http requests and reading their responses
