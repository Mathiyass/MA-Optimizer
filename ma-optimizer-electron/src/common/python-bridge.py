#!/usr/bin/env python3
"""
Python bridge for custom optimization algorithms.
This script is called by the CustomAlgorithm class to execute Python algorithms.
"""

import sys
import os
import json
import importlib.util

def load_module(plugins_path, algorithm_name):
    """
    Load a Python module from the plugins directory.
    
    Args:
        plugins_path (str): Path to the plugins directory
        algorithm_name (str): Name of the algorithm
        
    Returns:
        module: The loaded module
    """
    module_path = os.path.join(plugins_path, f"{algorithm_name}.py")
    
    if not os.path.exists(module_path):
        raise FileNotFoundError(f"Algorithm {algorithm_name} not found at {module_path}")
    
    spec = importlib.util.spec_from_file_location(algorithm_name, module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    
    return module

def main():
    """
    Main entry point for the Python bridge.
    
    Command-line arguments:
        1. plugins_path: Path to the plugins directory
        2. algorithm_name: Name of the algorithm
        3. method: Method to call
        4. data_json: JSON string containing the data to pass to the method
    """
    if len(sys.argv) < 5:
        print(json.dumps({
            "error": "Invalid arguments. Expected: plugins_path algorithm_name method data_json"
        }))
        sys.exit(1)
    
    plugins_path = sys.argv[1]
    algorithm_name = sys.argv[2]
    method = sys.argv[3]
    data_json = sys.argv[4]
    
    try:
        # Load the data
        data = json.loads(data_json)
        
        # Load the module
        module = load_module(plugins_path, algorithm_name)
        
        # Check if the method exists
        if not hasattr(module, method):
            print(json.dumps({
                "error": f"Method {method} not found in algorithm {algorithm_name}"
            }))
            sys.exit(1)
        
        # Call the method
        result = getattr(module, method)(**data)
        
        # Return the result
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({
            "error": str(e)
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()