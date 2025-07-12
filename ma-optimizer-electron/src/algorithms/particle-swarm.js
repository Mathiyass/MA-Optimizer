const { BaseAlgorithm } = require('./base-algorithm');

/**
 * Particle Swarm Optimization algorithm implementation
 */
class ParticleSwarm extends BaseAlgorithm {
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
    this.swarmSize = parameters.swarmSize || 30;
    this.inertiaWeight = parameters.inertiaWeight || 0.7;
    this.cognitiveWeight = parameters.cognitiveWeight || 1.5;
    this.socialWeight = parameters.socialWeight || 1.5;
    
    // Initialize swarm
    this.swarm = [];
    this.globalBest = null;
  }
  
  /**
   * Generate initial swarm
   */
  async generateInitialSolutions() {
    for (let i = 0; i < this.swarmSize; i++) {
      const particle = {
        position: {},
        velocity: {},
        personalBest: {
          position: {},
          objectiveValues: {},
          fitness: -Infinity,
        },
        objectiveValues: {},
        fitness: 0,
      };
      
      // Generate random position and velocity for each variable
      for (const variable of this.variables) {
        particle.position[variable.name] = this.generateRandomValue(variable);
        
        // Initialize velocity as a small random value
        const range = this.getVariableRange(variable);
        particle.velocity[variable.name] = (Math.random() * 2 - 1) * range * 0.1;
      }
      
      // Add to swarm if it satisfies all constraints
      if (this.checkConstraints(particle.position)) {
        this.swarm.push(particle);
      } else {
        // If the particle doesn't satisfy constraints, try again
        i--;
      }
    }
  }
  
  /**
   * Evaluate all particles in the swarm
   */
  async evaluateSolutions() {
    for (const particle of this.swarm) {
      // Evaluate objectives
      particle.objectiveValues = this.evaluateObjectives(particle.position);
      
      // Calculate fitness
      particle.fitness = this.calculateFitness(particle.objectiveValues);
      
      // Update personal best
      if (particle.fitness > particle.personalBest.fitness) {
        particle.personalBest = {
          position: { ...particle.position },
          objectiveValues: { ...particle.objectiveValues },
          fitness: particle.fitness,
        };
      }
      
      // Update global best
      if (!this.globalBest || particle.fitness > this.globalBest.fitness) {
        this.globalBest = {
          position: { ...particle.position },
          objectiveValues: { ...particle.objectiveValues },
          fitness: particle.fitness,
        };
        
        // Update best solution
        this.updateBestSolution(
          particle.position,
          particle.objectiveValues,
          particle.fitness
        );
      }
    }
  }
  
  /**
   * Perform one iteration of the particle swarm optimization algorithm
   * @returns {Object} - Best solution in the current iteration
   */
  async iterate() {
    // Initialize if not already initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Update each particle
    for (const particle of this.swarm) {
      // Update velocity and position for each variable
      for (const variable of this.variables) {
        const name = variable.name;
        
        // Calculate cognitive and social components
        const cognitive = this.cognitiveWeight * Math.random() * (particle.personalBest.position[name] - particle.position[name]);
        const social = this.socialWeight * Math.random() * (this.globalBest.position[name] - particle.position[name]);
        
        // Update velocity
        particle.velocity[name] = this.inertiaWeight * particle.velocity[name] + cognitive + social;
        
        // Apply velocity constraints
        const range = this.getVariableRange(variable);
        particle.velocity[name] = Math.max(-range, Math.min(range, particle.velocity[name]));
        
        // Update position
        particle.position[name] = this.updatePosition(
          particle.position[name],
          particle.velocity[name],
          variable
        );
      }
      
      // Check if the new position satisfies all constraints
      if (!this.checkConstraints(particle.position)) {
        // If not, revert to personal best position
        particle.position = { ...particle.personalBest.position };
      }
    }
    
    // Evaluate the updated swarm
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
   * Get the range of a variable
   * @param {Object} variable - Variable definition
   * @returns {number} - Range of the variable
   */
  getVariableRange(variable) {
    switch (variable.type) {
      case 'continuous':
      case 'discrete':
      case 'integer':
        return variable.max_value - variable.min_value;
      case 'categorical':
        return JSON.parse(variable.options || '[]').length;
      case 'boolean':
        return 1;
      default:
        throw new Error(`Unknown variable type: ${variable.type}`);
    }
  }
  
  /**
   * Update the position of a particle
   * @param {number|string|boolean} position - Current position
   * @param {number} velocity - Velocity
   * @param {Object} variable - Variable definition
   * @returns {number|string|boolean} - Updated position
   */
  updatePosition(position, velocity, variable) {
    switch (variable.type) {
      case 'continuous':
        return this.updateContinuousPosition(
          position,
          velocity,
          variable.min_value,
          variable.max_value
        );
      case 'discrete':
        return this.updateDiscretePosition(
          position,
          velocity,
          variable.min_value,
          variable.max_value,
          variable.step
        );
      case 'integer':
        return this.updateIntegerPosition(
          position,
          velocity,
          variable.min_value,
          variable.max_value
        );
      case 'categorical':
        return this.updateCategoricalPosition(
          position,
          velocity,
          JSON.parse(variable.options || '[]')
        );
      case 'boolean':
        return this.updateBooleanPosition(position, velocity);
      default:
        throw new Error(`Unknown variable type: ${variable.type}`);
    }
  }
  
  /**
   * Update a continuous position
   * @param {number} position - Current position
   * @param {number} velocity - Velocity
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} - Updated position
   */
  updateContinuousPosition(position, velocity, min, max) {
    let newPosition = position + velocity;
    
    // Ensure the position stays within bounds
    if (newPosition < min) {
      newPosition = min;
    } else if (newPosition > max) {
      newPosition = max;
    }
    
    return newPosition;
  }
  
  /**
   * Update a discrete position
   * @param {number} position - Current position
   * @param {number} velocity - Velocity
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} step - Step size
   * @returns {number} - Updated position
   */
  updateDiscretePosition(position, velocity, min, max, step) {
    let newPosition = position + velocity;
    
    // Ensure the position stays within bounds
    if (newPosition < min) {
      newPosition = min;
    } else if (newPosition > max) {
      newPosition = max;
    }
    
    // Round to the nearest step
    const steps = Math.round((newPosition - min) / step);
    newPosition = min + steps * step;
    
    return newPosition;
  }
  
  /**
   * Update an integer position
   * @param {number} position - Current position
   * @param {number} velocity - Velocity
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} - Updated position
   */
  updateIntegerPosition(position, velocity, min, max) {
    let newPosition = Math.round(position + velocity);
    
    // Ensure the position stays within bounds
    if (newPosition < min) {
      newPosition = min;
    } else if (newPosition > max) {
      newPosition = max;
    }
    
    return newPosition;
  }
  
  /**
   * Update a categorical position
   * @param {string} position - Current position
   * @param {number} velocity - Velocity
   * @param {Array} options - Array of options
   * @returns {string} - Updated position
   */
  updateCategoricalPosition(position, velocity, options) {
    // Get the current index
    const currentIndex = options.indexOf(position);
    
    // Calculate the new index
    let newIndex = currentIndex + Math.round(velocity);
    
    // Ensure the index stays within bounds
    if (newIndex < 0) {
      newIndex = 0;
    } else if (newIndex >= options.length) {
      newIndex = options.length - 1;
    }
    
    return options[newIndex];
  }
  
  /**
   * Update a boolean position
   * @param {boolean} position - Current position
   * @param {number} velocity - Velocity
   * @returns {boolean} - Updated position
   */
  updateBooleanPosition(position, velocity) {
    // Convert boolean to number
    const numericPosition = position ? 1 : 0;
    
    // Calculate the new position
    const newNumericPosition = numericPosition + velocity;
    
    // Convert back to boolean
    return newNumericPosition >= 0.5;
  }
}

module.exports = {
  ParticleSwarm,
};