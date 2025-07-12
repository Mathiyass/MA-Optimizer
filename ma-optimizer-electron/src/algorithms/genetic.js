const { BaseAlgorithm } = require('./base-algorithm');

/**
 * Genetic Algorithm implementation
 */
class GeneticAlgorithm extends BaseAlgorithm {
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
    this.populationSize = parameters.populationSize || 50;
    this.crossoverRate = parameters.crossoverRate || 0.8;
    this.mutationRate = parameters.mutationRate || 0.1;
    this.elitismCount = parameters.elitismCount || 2;
    this.tournamentSize = parameters.tournamentSize || 3;
    
    // Initialize population array
    this.population = [];
  }
  
  /**
   * Generate initial population
   */
  async generateInitialSolutions() {
    for (let i = 0; i < this.populationSize; i++) {
      const solution = {};
      
      // Generate random values for each variable
      for (const variable of this.variables) {
        solution[variable.name] = this.generateRandomValue(variable);
      }
      
      // Add to population if it satisfies all constraints
      if (this.checkConstraints(solution)) {
        this.population.push({
          variables: solution,
          objectiveValues: {},
          fitness: 0,
        });
      } else {
        // If the solution doesn't satisfy constraints, try again
        i--;
      }
    }
  }
  
  /**
   * Evaluate all solutions in the population
   */
  async evaluateSolutions() {
    for (const solution of this.population) {
      // Evaluate objectives
      solution.objectiveValues = this.evaluateObjectives(solution.variables);
      
      // Calculate fitness
      solution.fitness = this.calculateFitness(solution.objectiveValues);
      
      // Update best solution
      this.updateBestSolution(solution.variables, solution.objectiveValues, solution.fitness);
    }
    
    // Sort population by fitness (descending)
    this.population.sort((a, b) => b.fitness - a.fitness);
  }
  
  /**
   * Perform one iteration of the genetic algorithm
   * @returns {Object} - Best solution in the current iteration
   */
  async iterate() {
    // Initialize if not already initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Create new population
    const newPopulation = [];
    
    // Elitism: Keep the best solutions
    for (let i = 0; i < this.elitismCount; i++) {
      newPopulation.push(this.population[i]);
    }
    
    // Fill the rest of the population with new solutions
    while (newPopulation.length < this.populationSize) {
      // Select parents
      const parent1 = this.tournamentSelection();
      const parent2 = this.tournamentSelection();
      
      // Crossover
      let child1, child2;
      if (Math.random() < this.crossoverRate) {
        [child1, child2] = this.crossover(parent1, parent2);
      } else {
        child1 = { ...parent1 };
        child2 = { ...parent2 };
      }
      
      // Mutation
      this.mutate(child1);
      this.mutate(child2);
      
      // Add children to new population if they satisfy constraints
      if (this.checkConstraints(child1.variables) && newPopulation.length < this.populationSize) {
        newPopulation.push(child1);
      }
      
      if (this.checkConstraints(child2.variables) && newPopulation.length < this.populationSize) {
        newPopulation.push(child2);
      }
    }
    
    // Replace old population with new population
    this.population = newPopulation;
    
    // Evaluate new population
    await this.evaluateSolutions();
    
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
   * Tournament selection
   * @returns {Object} - Selected solution
   */
  tournamentSelection() {
    let best = null;
    
    for (let i = 0; i < this.tournamentSize; i++) {
      const index = Math.floor(Math.random() * this.population.length);
      const candidate = this.population[index];
      
      if (best === null || candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    
    return best;
  }
  
  /**
   * Crossover two parent solutions to create two child solutions
   * @param {Object} parent1 - First parent solution
   * @param {Object} parent2 - Second parent solution
   * @returns {Array} - Two child solutions
   */
  crossover(parent1, parent2) {
    const child1 = {
      variables: {},
      objectiveValues: {},
      fitness: 0,
    };
    
    const child2 = {
      variables: {},
      objectiveValues: {},
      fitness: 0,
    };
    
    // Single-point crossover
    const crossoverPoint = Math.floor(Math.random() * this.variables.length);
    
    for (let i = 0; i < this.variables.length; i++) {
      const variable = this.variables[i];
      
      if (i < crossoverPoint) {
        child1.variables[variable.name] = parent1.variables[variable.name];
        child2.variables[variable.name] = parent2.variables[variable.name];
      } else {
        child1.variables[variable.name] = parent2.variables[variable.name];
        child2.variables[variable.name] = parent1.variables[variable.name];
      }
    }
    
    return [child1, child2];
  }
  
  /**
   * Mutate a solution
   * @param {Object} solution - Solution to mutate
   */
  mutate(solution) {
    for (const variable of this.variables) {
      if (Math.random() < this.mutationRate) {
        solution.variables[variable.name] = this.generateRandomValue(variable);
      }
    }
  }
}

module.exports = {
  GeneticAlgorithm,
};