const { BaseAlgorithm } = require('./base-algorithm');

/**
 * Simulated Annealing algorithm implementation
 */
class SimulatedAnnealing extends BaseAlgorithm {
  /**
   * Constructor
   * @param {Array} variables - Array of variable definitions
   * @param {Array} constraints - Array of constraint definitions
   * @param {Array} objectives - Array of objective definitions
   * @param {Object} parameters - Algorithm parameters
   */
  constructor(variables, constraints, objectives, parameters = {}) {
    super(variables, constraints, objectives, parameters);
    
    // Set default parameters if not provided
    this.initialTemperature = parameters.initialTemperature || 100;
    this.coolingRate = parameters.coolingRate || 0.95;
    this.minTemperature = parameters.minTemperature || 0.01;
    
    // Current temperature
    this.temperature = this.initialTemperature;
    
    // Current solution
    this.currentSolution = null;
    this.currentObjectiveValues = null;
    this.currentFitness = 0;
  }
  
  /**
   * Generate initial solution
   */
  async generateInitialSolutions() {
    let solution = {};
    let validSolution = false;
    
    // Generate a valid initial solution
    while (!validSolution) {
      solution = {};
      
      // Generate random values for each variable
      for (const variable of this.variables) {
        solution[variable.name] = this.generateRandomValue(variable);
      }
      
      // Check if the solution satisfies all constraints
      validSolution = this.checkConstraints(solution);
    }
    
    // Set as current solution
    this.currentSolution = solution;
  }
  
  /**
   * Evaluate current solution
   */
  async evaluateSolutions() {
    // Evaluate objectives
    this.currentObjectiveValues = this.evaluateObjectives(this.currentSolution);
    
    // Calculate fitness
    this.currentFitness = this.calculateFitness(this.currentObjectiveValues);
    
    // Update best solution
    this.updateBestSolution(
      this.currentSolution,
      this.currentObjectiveValues,
      this.currentFitness
    );
  }
  
  /**
   * Perform one iteration of the simulated annealing algorithm
   * @returns {Object} - Best solution in the current iteration
   */
  async iterate() {
    // Initialize if not already initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Generate a neighbor solution
    const neighborSolution = this.generateNeighbor(this.currentSolution);
    
    // Check if the neighbor solution satisfies all constraints
    if (!this.checkConstraints(neighborSolution)) {
      // If not, return the current best solution
      return {
        variables: this.bestSolution.variables,
        objectiveValues: this.bestSolution.objectiveValues,
        fitness: this.bestSolution.fitness,
        isBest: true,
        iteration: this.currentIteration,
      };
    }
    
    // Evaluate the neighbor solution
    const neighborObjectiveValues = this.evaluateObjectives(neighborSolution);
    const neighborFitness = this.calculateFitness(neighborObjectiveValues);
    
    // Decide whether to accept the neighbor solution
    let accept = false;
    
    if (neighborFitness > this.currentFitness) {
      // If the neighbor is better, always accept it
      accept = true;
    } else {
      // If the neighbor is worse, accept it with a probability based on temperature
      const delta = neighborFitness - this.currentFitness;
      const probability = Math.exp(delta / this.temperature);
      
      if (Math.random() < probability) {
        accept = true;
      }
    }
    
    // Update current solution if accepted
    if (accept) {
      this.currentSolution = neighborSolution;
      this.currentObjectiveValues = neighborObjectiveValues;
      this.currentFitness = neighborFitness;
      
      // Update best solution
      const isBest = this.updateBestSolution(
        this.currentSolution,
        this.currentObjectiveValues,
        this.currentFitness
      );
    }
    
    // Cool down the temperature
    this.temperature *= this.coolingRate;
    
    // Ensure temperature doesn't go below minimum
    if (this.temperature < this.minTemperature) {
      this.temperature = this.minTemperature;
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
   * Generate a neighbor solution
   * @param {Object} solution - Current solution
   * @returns {Object} - Neighbor solution
   */
  generateNeighbor(solution) {
    const neighbor = { ...solution };
    
    // Randomly select a variable to modify
    const variableIndex = Math.floor(Math.random() * this.variables.length);
    const variable = this.variables[variableIndex];
    
    // Modify the variable value
    switch (variable.type) {
      case 'continuous':
        neighbor[variable.name] = this.perturbContinuous(
          solution[variable.name],
          variable.min_value,
          variable.max_value
        );
        break;
      case 'discrete':
        neighbor[variable.name] = this.perturbDiscrete(
          solution[variable.name],
          variable.min_value,
          variable.max_value,
          variable.step
        );
        break;
      case 'integer':
        neighbor[variable.name] = this.perturbInteger(
          solution[variable.name],
          variable.min_value,
          variable.max_value
        );
        break;
      case 'categorical':
        neighbor[variable.name] = this.perturbCategorical(
          solution[variable.name],
          JSON.parse(variable.options || '[]')
        );
        break;
      case 'boolean':
        neighbor[variable.name] = !solution[variable.name];
        break;
      default:
        throw new Error(`Unknown variable type: ${variable.type}`);
    }
    
    return neighbor;
  }
  
  /**
   * Perturb a continuous variable
   * @param {number} value - Current value
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} - Perturbed value
   */
  perturbContinuous(value, min, max) {
    // Perturb by a random amount proportional to the temperature
    const range = max - min;
    const perturbation = (Math.random() * 2 - 1) * range * (this.temperature / this.initialTemperature);
    let newValue = value + perturbation;
    
    // Ensure the value stays within bounds
    newValue = Math.max(min, Math.min(max, newValue));
    
    return newValue;
  }
  
  /**
   * Perturb a discrete variable
   * @param {number} value - Current value
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} step - Step size
   * @returns {number} - Perturbed value
   */
  perturbDiscrete(value, min, max, step) {
    // Perturb by a random number of steps
    const steps = Math.floor((max - min) / step) + 1;
    const currentStep = Math.round((value - min) / step);
    const perturbation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    let newStep = currentStep + perturbation;
    
    // Ensure the step stays within bounds
    newStep = Math.max(0, Math.min(steps - 1, newStep));
    
    return min + newStep * step;
  }
  
  /**
   * Perturb an integer variable
   * @param {number} value - Current value
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} - Perturbed value
   */
  perturbInteger(value, min, max) {
    // Perturb by a random amount proportional to the temperature
    const range = max - min;
    const perturbation = Math.floor((Math.random() * 2 - 1) * range * (this.temperature / this.initialTemperature));
    let newValue = value + perturbation;
    
    // Ensure the value stays within bounds
    newValue = Math.max(min, Math.min(max, newValue));
    
    return Math.floor(newValue);
  }
  
  /**
   * Perturb a categorical variable
   * @param {string} value - Current value
   * @param {Array} options - Array of options
   * @returns {string} - Perturbed value
   */
  perturbCategorical(value, options) {
    // With a probability proportional to the temperature, select a different option
    if (Math.random() < this.temperature / this.initialTemperature) {
      const currentIndex = options.indexOf(value);
      let newIndex;
      
      do {
        newIndex = Math.floor(Math.random() * options.length);
      } while (newIndex === currentIndex && options.length > 1);
      
      return options[newIndex];
    }
    
    return value;
  }
}

module.exports = {
  SimulatedAnnealing,
};