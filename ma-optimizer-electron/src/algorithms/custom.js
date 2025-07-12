const { BaseAlgorithm } = require('./base-algorithm');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { spawn } = require('child_process');

/**
 * Custom Algorithm implementation that loads algorithms from plugins
 */
class CustomAlgorithm extends BaseAlgorithm {
  /**
   * Constructor
   * @param {Array} variables - Array of variable definitions
   * @param {Array} constraints - Array of constraint definitions
   * @param {Array} objectives - Array of objective definitions
   * @param {Object} parameters - Algorithm parameters
   * @param {string} algorithmName - Name of the custom algorithm
   */
  constructor(variables, constraints, objectives, parameters = {}, algorithmName) {
    super(variables, constraints, objectives, parameters);
    
    this.algorithmName = algorithmName;
    this.pluginsPath = parameters.pluginsPath || path.join(app.getPath('userData'), 'plugins');
    this.algorithm = null;
    
    // Load the custom algorithm
    this.loadAlgorithm();
  }
  
  /**
   * Load the custom algorithm
   */
  loadAlgorithm() {
    try {
      // Check if the algorithm exists in the plugins directory
      const jsPath = path.join(this.pluginsPath, `${this.algorithmName}.js`);
      const pyPath = path.join(this.pluginsPath, `${this.algorithmName}.py`);
      
      if (fs.existsSync(jsPath)) {
        // Load JavaScript algorithm
        this.algorithm = require(jsPath);
        this.type = 'js';
      } else if (fs.existsSync(pyPath)) {
        // Python algorithm will be executed via child process
        this.type = 'py';
      } else {
        throw new Error(`Algorithm ${this.algorithmName} not found in plugins directory`);
      }
    } catch (error) {
      console.error(`Error loading custom algorithm: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate initial solutions
   */
  async generateInitialSolutions() {
    if (this.type === 'js') {
      // Call the JavaScript algorithm's initialize method
      if (typeof this.algorithm.initialize === 'function') {
        await this.algorithm.initialize(this.variables, this.constraints, this.objectives, this.parameters);
      }
    } else if (this.type === 'py') {
      // Execute the Python algorithm's initialize method
      await this.executePythonMethod('initialize', {
        variables: this.variables,
        constraints: this.constraints,
        objectives: this.objectives,
        parameters: this.parameters,
      });
    }
  }
  
  /**
   * Evaluate solutions
   */
  async evaluateSolutions() {
    if (this.type === 'js') {
      // Call the JavaScript algorithm's evaluate method
      if (typeof this.algorithm.evaluate === 'function') {
        const result = await this.algorithm.evaluate();
        
        if (result && result.bestSolution) {
          this.updateBestSolution(
            result.bestSolution.variables,
            result.bestSolution.objectiveValues,
            result.bestSolution.fitness
          );
        }
      }
    } else if (this.type === 'py') {
      // Execute the Python algorithm's evaluate method
      const result = await this.executePythonMethod('evaluate');
      
      if (result && result.bestSolution) {
        this.updateBestSolution(
          result.bestSolution.variables,
          result.bestSolution.objectiveValues,
          result.bestSolution.fitness
        );
      }
    }
  }
  
  /**
   * Perform one iteration of the custom algorithm
   * @returns {Object} - Best solution in the current iteration
   */
  async iterate() {
    // Initialize if not already initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    let result;
    
    if (this.type === 'js') {
      // Call the JavaScript algorithm's iterate method
      if (typeof this.algorithm.iterate === 'function') {
        result = await this.algorithm.iterate(this.currentIteration);
      }
    } else if (this.type === 'py') {
      // Execute the Python algorithm's iterate method
      result = await this.executePythonMethod('iterate', {
        iteration: this.currentIteration,
      });
    }
    
    // Update best solution if the algorithm returned a better one
    if (result && result.variables && result.objectiveValues) {
      const isBest = this.updateBestSolution(
        result.variables,
        result.objectiveValues,
        result.fitness
      );
      
      result.isBest = isBest;
    }
    
    // Increment iteration counter
    this.currentIteration++;
    
    // Return the best solution in the current iteration
    return {
      variables: this.bestSolution.variables,
      objectiveValues: this.bestSolution.objectiveValues,
      fitness: this.bestSolution.fitness,
      isBest: true,
      iteration: this.currentIteration,
    };
  }
  
  /**
   * Execute a Python method
   * @param {string} method - Method name
   * @param {Object} data - Data to pass to the method
   * @returns {Promise<Object>} - Result of the method
   */
  executePythonMethod(method, data = {}) {
    return new Promise((resolve, reject) => {
      const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
      const scriptPath = path.join(__dirname, '../common/python-bridge.py');
      
      const process = spawn(pythonPath, [
        scriptPath,
        this.pluginsPath,
        this.algorithmName,
        method,
        JSON.stringify(data),
      ]);
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            reject(new Error(`Error parsing Python output: ${error.message}`));
          }
        } else {
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
        }
      });
    });
  }
}

module.exports = {
  CustomAlgorithm,
};