# MA-Optimizer

A cross-platform desktop metaheuristic optimization tool for Windows/Linux PCs.

![MA-Optimizer](./public/screenshot.png)

## Features

- **Problem Wizard**: Step-through desktop UI for defining variables, constraints & objectives
- **Algorithm Engine**: Genetic Algorithm, Simulated Annealing, Particle Swarm, plus custom MA algorithms
- **Visualization Panel**: Embedded charting for convergence graphs, heatmaps, solution path replay
- **Local API & CLI**: Built-in Node.js server for scripting and CLI tool for batch runs
- **User Profiles & Projects**: Local user profiles and project management with history and snapshots

## Tech Stack

- **Frontend**: Electron + React 18, Tailwind CSS + Headless UI, Recharts/D3.js
- **Backend**: Node.js (bundled in Electron), SQLite for local storage, BullMQ for job queues
- **Algorithms**: Genetic Algorithm, Simulated Annealing, Particle Swarm, and custom algorithms

## Installation

### Prerequisites

- Node.js 16+
- npm 8+

### Development

1. Clone the repository:
   ```bash
   git clone https://github.com/Mathiyass/MA-Optimizer.git
   cd MA-Optimizer/ma-optimizer-electron
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Building

To build the application for your platform:

```bash
npm run build
```

The built application will be available in the `release` directory.

## CLI Usage

MA-Optimizer includes a command-line interface for batch operations:

```bash
# Initialize a new project
ma-opt init my-project

# Add a variable
ma-opt add-variable my-project.json --name x --type continuous --min 0 --max 10

# Add a constraint
ma-opt add-constraint my-project.json --expression "x + y <= 10"

# Add an objective
ma-opt add-objective my-project.json --name cost --expression "2*x + 3*y" --direction minimize

# Run an optimization
ma-opt optimize my-project.json --algorithm genetic --iterations 100
```

## API Server

The application includes a built-in API server that runs on port 3000 by default. You can use this API to interact with the application programmatically.

```bash
# Start the API server
ma-opt server
```

## Custom Algorithms

You can create custom algorithms by adding JavaScript or Python files to the plugins directory:

```javascript
// my-algorithm.js
module.exports = {
  initialize: async (variables, constraints, objectives, parameters) => {
    // Initialize your algorithm
  },
  
  iterate: async (iteration) => {
    // Perform one iteration
    return {
      variables: { x: 1.5, y: 2.3 },
      objectiveValues: { cost: 7.9 },
      fitness: 7.9,
    };
  },
};
```

## License

MIT

## Acknowledgements

- MATHIYA Team for the original concept
- All contributors to the project