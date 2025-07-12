#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const { initDatabase, getDb, closeDb } = require('../database/db');
const { GeneticAlgorithm } = require('../algorithms/genetic');
const { SimulatedAnnealing } = require('../algorithms/simulated-annealing');
const { ParticleSwarm } = require('../algorithms/particle-swarm');
const { CustomAlgorithm } = require('../algorithms/custom');
const os = require('os');
const yaml = require('js-yaml');

// Set up the CLI
program
  .name('ma-opt')
  .description('MA-Optimizer CLI - Metaheuristic optimization tool')
  .version('1.0.0');

// Initialize command
program
  .command('init')
  .description('Initialize a new optimization project')
  .argument('<name>', 'Project name')
  .option('-d, --description <description>', 'Project description')
  .option('-o, --output <path>', 'Output file path', './ma-optimizer-project.json')
  .action((name, options) => {
    const project = {
      name,
      description: options.description || '',
      variables: [],
      constraints: [],
      objectives: [],
      created_at: new Date().toISOString(),
    };
    
    const outputPath = path.resolve(options.output);
    fs.writeFileSync(outputPath, JSON.stringify(project, null, 2));
    
    console.log(`Project initialized: ${outputPath}`);
  });

// Add variable command
program
  .command('add-variable')
  .description('Add a variable to a project')
  .argument('<project>', 'Project file path')
  .requiredOption('-n, --name <name>', 'Variable name')
  .requiredOption('-t, --type <type>', 'Variable type (continuous, discrete, integer, categorical, boolean)')
  .option('--min <min>', 'Minimum value (for continuous, discrete, integer)')
  .option('--max <max>', 'Maximum value (for continuous, discrete, integer)')
  .option('--step <step>', 'Step size (for discrete)')
  .option('--options <options>', 'Options (for categorical, comma-separated)')
  .action((projectPath, options) => {
    const project = JSON.parse(fs.readFileSync(path.resolve(projectPath), 'utf8'));
    
    const variable = {
      name: options.name,
      type: options.type,
    };
    
    if (['continuous', 'discrete', 'integer'].includes(options.type)) {
      variable.min_value = parseFloat(options.min);
      variable.max_value = parseFloat(options.max);
      
      if (options.type === 'discrete') {
        variable.step = parseFloat(options.step);
      }
    } else if (options.type === 'categorical') {
      variable.options = options.options.split(',').map(o => o.trim());
    }
    
    project.variables.push(variable);
    
    fs.writeFileSync(path.resolve(projectPath), JSON.stringify(project, null, 2));
    
    console.log(`Variable added: ${options.name}`);
  });

// Add constraint command
program
  .command('add-constraint')
  .description('Add a constraint to a project')
  .argument('<project>', 'Project file path')
  .requiredOption('-e, --expression <expression>', 'Constraint expression')
  .option('-d, --description <description>', 'Constraint description')
  .action((projectPath, options) => {
    const project = JSON.parse(fs.readFileSync(path.resolve(projectPath), 'utf8'));
    
    const constraint = {
      expression: options.expression,
      description: options.description || '',
    };
    
    project.constraints.push(constraint);
    
    fs.writeFileSync(path.resolve(projectPath), JSON.stringify(project, null, 2));
    
    console.log(`Constraint added: ${options.expression}`);
  });

// Add objective command
program
  .command('add-objective')
  .description('Add an objective to a project')
  .argument('<project>', 'Project file path')
  .requiredOption('-n, --name <name>', 'Objective name')
  .requiredOption('-e, --expression <expression>', 'Objective expression')
  .requiredOption('-d, --direction <direction>', 'Optimization direction (minimize, maximize)')
  .option('-w, --weight <weight>', 'Objective weight', '1.0')
  .action((projectPath, options) => {
    const project = JSON.parse(fs.readFileSync(path.resolve(projectPath), 'utf8'));
    
    const objective = {
      name: options.name,
      expression: options.expression,
      direction: options.direction,
      weight: parseFloat(options.weight),
    };
    
    project.objectives.push(objective);
    
    fs.writeFileSync(path.resolve(projectPath), JSON.stringify(project, null, 2));
    
    console.log(`Objective added: ${options.name}`);
  });

// Import command
program
  .command('import')
  .description('Import a project from YAML or JSON')
  .argument('<file>', 'Input file path (YAML or JSON)')
  .option('-o, --output <path>', 'Output file path', './ma-optimizer-project.json')
  .action((filePath, options) => {
    const inputPath = path.resolve(filePath);
    const outputPath = path.resolve(options.output);
    
    let project;
    
    if (inputPath.endsWith('.yaml') || inputPath.endsWith('.yml')) {
      project = yaml.load(fs.readFileSync(inputPath, 'utf8'));
    } else {
      project = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(project, null, 2));
    
    console.log(`Project imported: ${outputPath}`);
  });

// Export command
program
  .command('export')
  .description('Export a project to YAML')
  .argument('<project>', 'Project file path')
  .option('-o, --output <path>', 'Output file path', './ma-optimizer-project.yaml')
  .action((projectPath, options) => {
    const project = JSON.parse(fs.readFileSync(path.resolve(projectPath), 'utf8'));
    const outputPath = path.resolve(options.output);
    
    fs.writeFileSync(outputPath, yaml.dump(project));
    
    console.log(`Project exported: ${outputPath}`);
  });

// Optimize command
program
  .command('optimize')
  .description('Run an optimization')
  .argument('<project>', 'Project file path')
  .requiredOption('-a, --algorithm <algorithm>', 'Algorithm to use (genetic, simulated-annealing, particle-swarm, or custom)')
  .option('-p, --parameters <parameters>', 'Algorithm parameters (JSON string)', '{}')
  .option('-i, --iterations <iterations>', 'Maximum number of iterations', '100')
  .option('-o, --output <path>', 'Output file path', './ma-optimizer-results.json')
  .action(async (projectPath, options) => {
    const project = JSON.parse(fs.readFileSync(path.resolve(projectPath), 'utf8'));
    const parameters = JSON.parse(options.parameters);
    parameters.maxIterations = parseInt(options.iterations);
    
    // Create algorithm instance
    let algorithm;
    switch (options.algorithm.toLowerCase()) {
      case 'genetic':
        algorithm = new GeneticAlgorithm(project.variables, project.constraints, project.objectives, parameters);
        break;
      case 'simulated-annealing':
        algorithm = new SimulatedAnnealing(project.variables, project.constraints, project.objectives, parameters);
        break;
      case 'particle-swarm':
        algorithm = new ParticleSwarm(project.variables, project.constraints, project.objectives, parameters);
        break;
      default:
        // Try to load a custom algorithm
        algorithm = new CustomAlgorithm(project.variables, project.constraints, project.objectives, parameters, options.algorithm);
    }
    
    console.log(`Starting optimization with ${options.algorithm} algorithm...`);
    
    // Initialize the algorithm
    await algorithm.initialize();
    
    // Track progress
    const startTime = Date.now();
    const results = {
      algorithm: options.algorithm,
      parameters,
      iterations: [],
      bestSolution: null,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
    };
    
    // Run the optimization
    for (let i = 0; i < parameters.maxIterations; i++) {
      const result = await algorithm.iterate();
      
      // Add to results
      results.iterations.push({
        iteration: i,
        variables: result.variables,
        objectiveValues: result.objectiveValues,
        fitness: result.fitness,
        isBest: result.isBest,
      });
      
      // Update best solution
      if (result.isBest) {
        results.bestSolution = {
          variables: result.variables,
          objectiveValues: result.objectiveValues,
          fitness: result.fitness,
          iteration: i,
        };
      }
      
      // Print progress
      if (i % 10 === 0 || i === parameters.maxIterations - 1) {
        const progress = Math.round((i + 1) / parameters.maxIterations * 100);
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`Progress: ${progress}% (${i + 1}/${parameters.maxIterations}) - Elapsed: ${elapsed}s`);
      }
    }
    
    // Update results
    results.endTime = new Date().toISOString();
    results.duration = Math.round((Date.now() - startTime) / 1000);
    
    // Save results
    const outputPath = path.resolve(options.output);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log(`Optimization completed in ${results.duration}s`);
    console.log(`Best solution (fitness: ${results.bestSolution.fitness}):`);
    console.log(JSON.stringify(results.bestSolution.variables, null, 2));
    console.log(`Results saved to: ${outputPath}`);
  });

// Server command
program
  .command('server')
  .description('Start the API server')
  .option('-p, --port <port>', 'Port to listen on', '3000')
  .action((options) => {
    const { startApiServer } = require('../api/server');
    
    // Initialize database
    const userDataPath = path.join(os.homedir(), '.ma-optimizer');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    initDatabase(userDataPath);
    
    // Start server
    const server = startApiServer(parseInt(options.port));
    
    console.log(`API server running on port ${options.port}`);
    console.log('Press Ctrl+C to stop');
    
    // Handle shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down server...');
      server.close(() => {
        closeDb();
        console.log('Server stopped');
        process.exit(0);
      });
    });
  });

// Parse command-line arguments
program.parse(process.argv);

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}