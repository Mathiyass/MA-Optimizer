const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { getDb } = require('../database/db');
const { GeneticAlgorithm } = require('../algorithms/genetic');
const { SimulatedAnnealing } = require('../algorithms/simulated-annealing');
const { ParticleSwarm } = require('../algorithms/particle-swarm');
const { CustomAlgorithm } = require('../algorithms/custom');

/**
 * Start the API server
 * @param {number} port - Port to listen on
 * @returns {Object} - Express server instance
 */
function startApiServer(port = 3000) {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));
  
  // API routes
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
  });
  
  // Get all projects
  app.get('/api/projects', (req, res) => {
    try {
      const db = getDb();
      const projects = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get project by ID
  app.get('/api/projects/:id', (req, res) => {
    try {
      const db = getDb();
      const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Get variables, constraints, and objectives
      const variables = db.prepare('SELECT * FROM variables WHERE project_id = ?').all(project.id);
      const constraints = db.prepare('SELECT * FROM constraints WHERE project_id = ?').all(project.id);
      const objectives = db.prepare('SELECT * FROM objectives WHERE project_id = ?').all(project.id);
      
      res.json({
        ...project,
        variables,
        constraints,
        objectives,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Create a new project
  app.post('/api/projects', (req, res) => {
    try {
      const { name, description, config, user_id } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
      }
      
      const db = getDb();
      const result = db.prepare(
        'INSERT INTO projects (name, description, config, user_id) VALUES (?, ?, ?, ?)'
      ).run(name, description, JSON.stringify(config || {}), user_id || 1);
      
      const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update a project
  app.put('/api/projects/:id', (req, res) => {
    try {
      const { name, description, config } = req.body;
      const db = getDb();
      
      db.prepare(
        'UPDATE projects SET name = ?, description = ?, config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(name, description, JSON.stringify(config || {}), req.params.id);
      
      const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete a project
  app.delete('/api/projects/:id', (req, res) => {
    try {
      const db = getDb();
      
      // Delete related data first
      db.prepare('DELETE FROM variables WHERE project_id = ?').run(req.params.id);
      db.prepare('DELETE FROM constraints WHERE project_id = ?').run(req.params.id);
      db.prepare('DELETE FROM objectives WHERE project_id = ?').run(req.params.id);
      
      // Get optimization runs for this project
      const runs = db.prepare('SELECT id FROM optimization_runs WHERE project_id = ?').all(req.params.id);
      
      // Delete solutions for each run
      runs.forEach(run => {
        db.prepare('DELETE FROM solutions WHERE run_id = ?').run(run.id);
      });
      
      // Delete optimization runs
      db.prepare('DELETE FROM optimization_runs WHERE project_id = ?').run(req.params.id);
      
      // Finally delete the project
      const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Variables API
  
  // Get all variables for a project
  app.get('/api/projects/:id/variables', (req, res) => {
    try {
      const db = getDb();
      const variables = db.prepare('SELECT * FROM variables WHERE project_id = ?').all(req.params.id);
      res.json(variables);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Add a variable to a project
  app.post('/api/projects/:id/variables', (req, res) => {
    try {
      const { name, type, min_value, max_value, step, options } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ error: 'Variable name and type are required' });
      }
      
      const db = getDb();
      const result = db.prepare(
        'INSERT INTO variables (project_id, name, type, min_value, max_value, step, options) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        req.params.id,
        name,
        type,
        min_value,
        max_value,
        step,
        options ? JSON.stringify(options) : null
      );
      
      const variable = db.prepare('SELECT * FROM variables WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(variable);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update a variable
  app.put('/api/variables/:id', (req, res) => {
    try {
      const { name, type, min_value, max_value, step, options } = req.body;
      
      const db = getDb();
      db.prepare(
        'UPDATE variables SET name = ?, type = ?, min_value = ?, max_value = ?, step = ?, options = ? WHERE id = ?'
      ).run(
        name,
        type,
        min_value,
        max_value,
        step,
        options ? JSON.stringify(options) : null,
        req.params.id
      );
      
      const variable = db.prepare('SELECT * FROM variables WHERE id = ?').get(req.params.id);
      
      if (!variable) {
        return res.status(404).json({ error: 'Variable not found' });
      }
      
      res.json(variable);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete a variable
  app.delete('/api/variables/:id', (req, res) => {
    try {
      const db = getDb();
      const result = db.prepare('DELETE FROM variables WHERE id = ?').run(req.params.id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Variable not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Constraints API
  
  // Get all constraints for a project
  app.get('/api/projects/:id/constraints', (req, res) => {
    try {
      const db = getDb();
      const constraints = db.prepare('SELECT * FROM constraints WHERE project_id = ?').all(req.params.id);
      res.json(constraints);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Add a constraint to a project
  app.post('/api/projects/:id/constraints', (req, res) => {
    try {
      const { expression, description } = req.body;
      
      if (!expression) {
        return res.status(400).json({ error: 'Constraint expression is required' });
      }
      
      const db = getDb();
      const result = db.prepare(
        'INSERT INTO constraints (project_id, expression, description) VALUES (?, ?, ?)'
      ).run(req.params.id, expression, description);
      
      const constraint = db.prepare('SELECT * FROM constraints WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(constraint);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update a constraint
  app.put('/api/constraints/:id', (req, res) => {
    try {
      const { expression, description } = req.body;
      
      const db = getDb();
      db.prepare(
        'UPDATE constraints SET expression = ?, description = ? WHERE id = ?'
      ).run(expression, description, req.params.id);
      
      const constraint = db.prepare('SELECT * FROM constraints WHERE id = ?').get(req.params.id);
      
      if (!constraint) {
        return res.status(404).json({ error: 'Constraint not found' });
      }
      
      res.json(constraint);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete a constraint
  app.delete('/api/constraints/:id', (req, res) => {
    try {
      const db = getDb();
      const result = db.prepare('DELETE FROM constraints WHERE id = ?').run(req.params.id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Constraint not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Objectives API
  
  // Get all objectives for a project
  app.get('/api/projects/:id/objectives', (req, res) => {
    try {
      const db = getDb();
      const objectives = db.prepare('SELECT * FROM objectives WHERE project_id = ?').all(req.params.id);
      res.json(objectives);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Add an objective to a project
  app.post('/api/projects/:id/objectives', (req, res) => {
    try {
      const { name, expression, direction, weight } = req.body;
      
      if (!name || !expression || !direction) {
        return res.status(400).json({ error: 'Objective name, expression, and direction are required' });
      }
      
      const db = getDb();
      const result = db.prepare(
        'INSERT INTO objectives (project_id, name, expression, direction, weight) VALUES (?, ?, ?, ?, ?)'
      ).run(req.params.id, name, expression, direction, weight || 1.0);
      
      const objective = db.prepare('SELECT * FROM objectives WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(objective);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update an objective
  app.put('/api/objectives/:id', (req, res) => {
    try {
      const { name, expression, direction, weight } = req.body;
      
      const db = getDb();
      db.prepare(
        'UPDATE objectives SET name = ?, expression = ?, direction = ?, weight = ? WHERE id = ?'
      ).run(name, expression, direction, weight || 1.0, req.params.id);
      
      const objective = db.prepare('SELECT * FROM objectives WHERE id = ?').get(req.params.id);
      
      if (!objective) {
        return res.status(404).json({ error: 'Objective not found' });
      }
      
      res.json(objective);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete an objective
  app.delete('/api/objectives/:id', (req, res) => {
    try {
      const db = getDb();
      const result = db.prepare('DELETE FROM objectives WHERE id = ?').run(req.params.id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Objective not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Optimization API
  
  // Start an optimization run
  app.post('/api/projects/:id/optimize', (req, res) => {
    try {
      const { algorithm, parameters } = req.body;
      
      if (!algorithm) {
        return res.status(400).json({ error: 'Algorithm is required' });
      }
      
      const db = getDb();
      
      // Create optimization run
      const runResult = db.prepare(
        'INSERT INTO optimization_runs (project_id, algorithm, parameters, status) VALUES (?, ?, ?, ?)'
      ).run(req.params.id, algorithm, JSON.stringify(parameters || {}), 'running');
      
      const runId = runResult.lastInsertRowid;
      
      // Return the run ID immediately
      res.status(201).json({ id: runId, status: 'running' });
      
      // Start the optimization in the background
      startOptimization(req.params.id, runId, algorithm, parameters);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get optimization run status
  app.get('/api/optimization-runs/:id', (req, res) => {
    try {
      const db = getDb();
      const run = db.prepare('SELECT * FROM optimization_runs WHERE id = ?').get(req.params.id);
      
      if (!run) {
        return res.status(404).json({ error: 'Optimization run not found' });
      }
      
      // Get the best solution
      const bestSolution = db.prepare(
        'SELECT * FROM solutions WHERE run_id = ? AND is_best = 1'
      ).get(run.id);
      
      // Get the latest solutions (limited to 100)
      const latestSolutions = db.prepare(
        'SELECT * FROM solutions WHERE run_id = ? ORDER BY iteration DESC LIMIT 100'
      ).all(run.id);
      
      res.json({
        ...run,
        parameters: JSON.parse(run.parameters || '{}'),
        bestSolution: bestSolution ? {
          ...bestSolution,
          variables: JSON.parse(bestSolution.variables || '{}'),
          objective_values: JSON.parse(bestSolution.objective_values || '{}'),
        } : null,
        latestSolutions: latestSolutions.map(solution => ({
          ...solution,
          variables: JSON.parse(solution.variables || '{}'),
          objective_values: JSON.parse(solution.objective_values || '{}'),
        })),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Stop an optimization run
  app.post('/api/optimization-runs/:id/stop', (req, res) => {
    try {
      const db = getDb();
      
      // Update the run status
      db.prepare(
        'UPDATE optimization_runs SET status = ?, end_time = CURRENT_TIMESTAMP WHERE id = ?'
      ).run('stopped', req.params.id);
      
      // In a real implementation, you would also need to stop the actual optimization process
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get all optimization runs for a project
  app.get('/api/projects/:id/optimization-runs', (req, res) => {
    try {
      const db = getDb();
      const runs = db.prepare('SELECT * FROM optimization_runs WHERE project_id = ? ORDER BY start_time DESC').all(req.params.id);
      res.json(runs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get solutions for an optimization run
  app.get('/api/optimization-runs/:id/solutions', (req, res) => {
    try {
      const db = getDb();
      const solutions = db.prepare(
        'SELECT * FROM solutions WHERE run_id = ? ORDER BY iteration'
      ).all(req.params.id);
      
      res.json(solutions.map(solution => ({
        ...solution,
        variables: JSON.parse(solution.variables || '{}'),
        objective_values: JSON.parse(solution.objective_values || '{}'),
      })));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Plugins API
  
  // Get all plugins
  app.get('/api/plugins', (req, res) => {
    try {
      const db = getDb();
      const plugins = db.prepare('SELECT * FROM plugins ORDER BY name').all();
      res.json(plugins);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Register a plugin
  app.post('/api/plugins', (req, res) => {
    try {
      const { name, version, author, description, path, type } = req.body;
      
      if (!name || !path || !type) {
        return res.status(400).json({ error: 'Plugin name, path, and type are required' });
      }
      
      const db = getDb();
      const result = db.prepare(
        'INSERT INTO plugins (name, version, author, description, path, type) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(name, version, author, description, path, type);
      
      const plugin = db.prepare('SELECT * FROM plugins WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(plugin);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Update a plugin
  app.put('/api/plugins/:id', (req, res) => {
    try {
      const { name, version, author, description, path, type, enabled } = req.body;
      
      const db = getDb();
      db.prepare(
        'UPDATE plugins SET name = ?, version = ?, author = ?, description = ?, path = ?, type = ?, enabled = ? WHERE id = ?'
      ).run(name, version, author, description, path, type, enabled ? 1 : 0, req.params.id);
      
      const plugin = db.prepare('SELECT * FROM plugins WHERE id = ?').get(req.params.id);
      
      if (!plugin) {
        return res.status(404).json({ error: 'Plugin not found' });
      }
      
      res.json(plugin);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Delete a plugin
  app.delete('/api/plugins/:id', (req, res) => {
    try {
      const db = getDb();
      const result = db.prepare('DELETE FROM plugins WHERE id = ?').run(req.params.id);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Plugin not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Start the server
  const server = app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
  
  return server;
}

/**
 * Start an optimization run
 * @param {number} projectId - Project ID
 * @param {number} runId - Optimization run ID
 * @param {string} algorithmName - Algorithm name
 * @param {Object} parameters - Algorithm parameters
 */
async function startOptimization(projectId, runId, algorithmName, parameters) {
  try {
    const db = getDb();
    
    // Get project data
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    const variables = db.prepare('SELECT * FROM variables WHERE project_id = ?').all(projectId);
    const constraints = db.prepare('SELECT * FROM constraints WHERE project_id = ?').all(projectId);
    const objectives = db.prepare('SELECT * FROM objectives WHERE project_id = ?').all(projectId);
    
    // Create algorithm instance
    let algorithm;
    switch (algorithmName.toLowerCase()) {
      case 'genetic':
        algorithm = new GeneticAlgorithm(variables, constraints, objectives, parameters);
        break;
      case 'simulated-annealing':
        algorithm = new SimulatedAnnealing(variables, constraints, objectives, parameters);
        break;
      case 'particle-swarm':
        algorithm = new ParticleSwarm(variables, constraints, objectives, parameters);
        break;
      default:
        // Try to load a custom algorithm
        algorithm = new CustomAlgorithm(variables, constraints, objectives, parameters, algorithmName);
    }
    
    // Run the optimization
    const maxIterations = parameters?.maxIterations || 100;
    
    for (let i = 0; i < maxIterations; i++) {
      // Check if the run was stopped
      const run = db.prepare('SELECT status FROM optimization_runs WHERE id = ?').get(runId);
      if (run.status !== 'running') {
        break;
      }
      
      // Perform one iteration
      const result = await algorithm.iterate();
      
      // Save the solution
      const solutionResult = db.prepare(
        'INSERT INTO solutions (run_id, iteration, variables, objective_values, fitness, is_best) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(
        runId,
        i,
        JSON.stringify(result.variables),
        JSON.stringify(result.objectiveValues),
        result.fitness,
        result.isBest ? 1 : 0
      );
      
      // If this is the best solution, update any previous best solutions
      if (result.isBest) {
        db.prepare(
          'UPDATE solutions SET is_best = 0 WHERE run_id = ? AND id != ?'
        ).run(runId, solutionResult.lastInsertRowid);
      }
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Update the run status
    db.prepare(
      'UPDATE optimization_runs SET status = ?, end_time = CURRENT_TIMESTAMP WHERE id = ?'
    ).run('completed', runId);
  } catch (error) {
    console.error('Error in optimization:', error);
    
    // Update the run status
    const db = getDb();
    db.prepare(
      'UPDATE optimization_runs SET status = ?, end_time = CURRENT_TIMESTAMP WHERE id = ?'
    ).run('failed', runId);
  }
}

module.exports = {
  startApiServer,
};