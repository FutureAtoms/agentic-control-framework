#!/usr/bin/env python3
"""
SWE-bench Evaluation Runner with ACF MCP Integration

This script runs SWE-bench evaluations using the Agentic Control Framework MCP server
for enhanced code editing and task management capabilities.
"""

import asyncio
import json
import logging
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Any

import click
import yaml
from datasets import load_dataset
from loguru import logger
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from tenacity import retry, stop_after_attempt, wait_exponential

# Add parent directory to path for ACF imports
sys.path.insert(0, str(Path(__file__).parent.parent))

console = Console()

@dataclass
class EvaluationConfig:
    """Configuration for SWE-bench evaluation"""
    dataset_name: str
    num_workers: int
    max_instances: Optional[int]
    agent_strategy: str
    use_task_manager: bool
    output_dir: Path
    verbose: bool
    
    @classmethod
    def from_yaml(cls, config_path: str = "config.yaml") -> "EvaluationConfig":
        """Load configuration from YAML file"""
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        return cls(
            dataset_name=config['swebench']['datasets']['default'],
            num_workers=config['swebench']['evaluation']['max_workers'],
            max_instances=None,
            agent_strategy=config['agent']['strategy'],
            use_task_manager=config['task_management']['enabled'],
            output_dir=Path(config['swebench']['evaluation']['output_dir']),
            verbose=config['agent']['behavior']['verbose']
        )


class ACFMCPClient:
    """Client for interacting with ACF MCP Server"""
    
    def __init__(self, host: str = "localhost", port: int = 3000):
        self.host = host
        self.port = port
        self.ws_url = f"ws://{host}:{port}"
        self.connection = None
        
    async def connect(self):
        """Establish connection to ACF MCP server"""
        import websockets
        try:
            self.connection = await websockets.connect(self.ws_url)
            logger.info(f"Connected to ACF MCP server at {self.ws_url}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to ACF MCP server: {e}")
            return False
    
    async def call_tool(self, tool_name: str, params: Dict) -> Dict:
        """Call an ACF tool via MCP protocol"""
        if not self.connection:
            await self.connect()
        
        request = {
            "jsonrpc": "2.0",
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": params
            },
            "id": str(time.time())
        }
        
        await self.connection.send(json.dumps(request))
        response = await self.connection.recv()
        return json.loads(response)
    
    async def close(self):
        """Close connection to MCP server"""
        if self.connection:
            await self.connection.close()


class SWEBenchAgent:
    """Agent for solving SWE-bench instances using ACF tools"""
    
    def __init__(self, acf_client: ACFMCPClient, strategy: str = "advanced"):
        self.acf = acf_client
        self.strategy = strategy
        
    async def solve_instance(self, instance: Dict) -> Dict:
        """
        Solve a single SWE-bench instance
        
        Args:
            instance: SWE-bench instance dictionary
            
        Returns:
            Dictionary containing the predicted patch
        """
        logger.info(f"Solving instance: {instance['instance_id']}")
        
        # 1. Set up workspace
        workspace_path = f"/tmp/swebench/{instance['instance_id']}"
        await self.acf.call_tool("setWorkspace", {"workspacePath": workspace_path})
        
        # 2. Initialize project and task management
        if self.strategy in ["advanced", "custom"]:
            await self.acf.call_tool("initProject", {
                "projectName": instance['instance_id'],
                "projectDescription": instance['problem_statement']
            })
        
        # 3. Analyze the problem
        analysis = await self._analyze_problem(instance)
        
        # 4. Locate relevant code
        code_locations = await self._locate_code(instance, analysis)
        
        # 5. Generate solution plan
        plan = await self._generate_plan(instance, analysis, code_locations)
        
        # 6. Implement the fix
        patch = await self._implement_solution(instance, plan)
        
        # 7. Validate with tests
        validation = await self._validate_solution(instance, patch)
        
        return {
            "instance_id": instance['instance_id'],
            "model_patch": patch,
            "validation": validation,
            "metadata": {
                "strategy": self.strategy,
                "analysis": analysis,
                "plan": plan
            }
        }
    
    async def _analyze_problem(self, instance: Dict) -> Dict:
        """Analyze the problem statement and test failures"""
        logger.debug("Analyzing problem statement...")
        
        # Search for relevant code patterns
        search_results = await self.acf.call_tool("search_code", {
            "path": instance['repo'],
            "pattern": instance.get('fail_to_pass', ['test_'])[0] if instance.get('fail_to_pass') else 'def test_',
            "maxResults": 50
        })
        
        # Create task for problem analysis
        if self.strategy == "advanced":
            await self.acf.call_tool("addTask", {
                "title": "Understand the problem",
                "description": f"Analyze: {instance['problem_statement'][:500]}...",
                "priority": "critical"
            })
        
        return {
            "test_files": search_results.get('matches', []),
            "problem_type": self._classify_problem(instance['problem_statement'])
        }
    
    async def _locate_code(self, instance: Dict, analysis: Dict) -> List[Dict]:
        """Locate relevant code sections"""
        logger.debug("Locating relevant code...")
        
        locations = []
        
        # Search for implementation files
        for test_file in analysis.get('test_files', []):
            # Extract function/class names from test file
            content = await self.acf.call_tool("read_file", {"path": test_file['path']})
            
            # Search for corresponding implementation
            if 'test_' in test_file['path']:
                impl_pattern = test_file['path'].replace('test_', '').replace('_test', '')
                impl_search = await self.acf.call_tool("search_code", {
                    "path": instance['repo'],
                    "pattern": impl_pattern,
                    "maxResults": 10
                })
                locations.extend(impl_search.get('matches', []))
        
        return locations
    
    async def _generate_plan(self, instance: Dict, analysis: Dict, locations: List[Dict]) -> Dict:
        """Generate a solution plan"""
        logger.debug("Generating solution plan...")
        
        plan = {
            "steps": [],
            "priority": "high",
            "estimated_changes": len(locations)
        }
        
        if self.strategy == "advanced":
            # Create subtasks for each step
            main_task = await self.acf.call_tool("addTask", {
                "title": f"Fix: {instance['instance_id']}",
                "description": instance['problem_statement'][:1000],
                "priority": "critical"
            })
            
            # Add subtasks
            for i, location in enumerate(locations):
                await self.acf.call_tool("addSubtask", {
                    "parentId": main_task['id'],
                    "title": f"Modify {location['path']}",
                    "relatedFiles": location['path']
                })
                
                plan["steps"].append({
                    "file": location['path'],
                    "action": "modify",
                    "line_range": location.get('line_range', [])
                })
        
        return plan
    
    async def _implement_solution(self, instance: Dict, plan: Dict) -> str:
        """Implement the solution based on the plan"""
        logger.debug("Implementing solution...")
        
        patches = []
        
        for step in plan.get("steps", []):
            file_path = step["file"]
            
            # Read current file content
            current_content = await self.acf.call_tool("read_file", {"path": file_path})
            
            # Apply modifications based on problem analysis
            # This is where you'd integrate with an LLM or use pattern-based fixes
            modified_content = await self._apply_fix_to_content(
                current_content['content'],
                instance,
                step
            )
            
            # Use edit_block for surgical changes
            if modified_content != current_content['content']:
                result = await self.acf.call_tool("edit_block", {
                    "file_path": file_path,
                    "old_string": self._extract_relevant_section(current_content['content'], step),
                    "new_string": self._extract_relevant_section(modified_content, step),
                    "expected_replacements": 1
                })
                
                patches.append({
                    "file": file_path,
                    "original": current_content['content'],
                    "modified": modified_content
                })
        
        # Generate unified diff
        return self._generate_patch(patches)
    
    async def _validate_solution(self, instance: Dict, patch: str) -> Dict:
        """Validate the solution by running tests"""
        logger.debug("Validating solution...")
        
        validation_results = {
            "tests_pass": False,
            "error": None,
            "output": ""
        }
        
        try:
            # Run the failing tests
            for test in instance.get('fail_to_pass', []):
                result = await self.acf.call_tool("execute_command", {
                    "command": f"python -m pytest {test} -xvs",
                    "timeout_ms": 30000
                })
                
                validation_results["output"] += result.get('output', '')
                validation_results["tests_pass"] = result.get('exitCode', 1) == 0
                
                if not validation_results["tests_pass"]:
                    break
            
        except Exception as e:
            validation_results["error"] = str(e)
            logger.error(f"Validation failed: {e}")
        
        return validation_results
    
    def _classify_problem(self, problem_statement: str) -> str:
        """Classify the type of problem"""
        keywords = {
            "bug": ["error", "exception", "fail", "crash", "bug"],
            "feature": ["add", "implement", "support", "feature", "new"],
            "refactor": ["refactor", "improve", "optimize", "cleanup"],
            "test": ["test", "coverage", "assert", "mock"]
        }
        
        problem_lower = problem_statement.lower()
        for category, words in keywords.items():
            if any(word in problem_lower for word in words):
                return category
        
        return "unknown"
    
    async def _apply_fix_to_content(self, content: str, instance: Dict, step: Dict) -> str:
        """Apply fix to file content (placeholder for LLM integration)"""
        # This is where you would integrate with an LLM to generate the actual fix
        # For now, returning original content as placeholder
        return content
    
    def _extract_relevant_section(self, content: str, step: Dict) -> str:
        """Extract relevant section of code"""
        lines = content.split('\n')
        if step.get('line_range'):
            start, end = step['line_range']
            return '\n'.join(lines[start-1:end])
        return content[:1000]  # First 1000 chars as fallback
    
    def _generate_patch(self, patches: List[Dict]) -> str:
        """Generate unified diff patch"""
        import difflib
        
        full_patch = ""
        for patch in patches:
            diff = difflib.unified_diff(
                patch['original'].splitlines(keepends=True),
                patch['modified'].splitlines(keepends=True),
                fromfile=f"a/{patch['file']}",
                tofile=f"b/{patch['file']}"
            )
            full_patch += ''.join(diff)
        
        return full_patch


class SWEBenchEvaluator:
    """Main evaluator for running SWE-bench with ACF"""
    
    def __init__(self, config: EvaluationConfig):
        self.config = config
        self.acf_client = ACFMCPClient()
        self.agent = SWEBenchAgent(self.acf_client, config.agent_strategy)
        self.results = []
        
    async def run(self):
        """Run the evaluation"""
        console.print("[bold green]Starting SWE-bench Evaluation with ACF MCP[/bold green]")
        
        # Connect to ACF MCP server
        connected = await self.acf_client.connect()
        if not connected:
            console.print("[bold red]Failed to connect to ACF MCP server![/bold red]")
            console.print("Please ensure the server is running: npm run start:mcp")
            return
        
        # Load dataset
        console.print(f"Loading dataset: {self.config.dataset_name}")
        dataset = load_dataset(self.config.dataset_name, split='test')
        
        # Limit instances if specified
        if self.config.max_instances:
            dataset = dataset.select(range(min(self.config.max_instances, len(dataset))))
        
        console.print(f"Processing {len(dataset)} instances...")
        
        # Process instances
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            
            task = progress.add_task("Evaluating instances...", total=len(dataset))
            
            for instance in dataset:
                try:
                    result = await self.agent.solve_instance(instance)
                    self.results.append(result)
                    progress.update(task, advance=1, description=f"Completed: {instance['instance_id']}")
                    
                except Exception as e:
                    logger.error(f"Failed to process {instance['instance_id']}: {e}")
                    self.results.append({
                        "instance_id": instance['instance_id'],
                        "error": str(e),
                        "model_patch": ""
                    })
                    progress.update(task, advance=1)
        
        # Save results
        await self._save_results()
        
        # Close connection
        await self.acf_client.close()
        
        console.print("[bold green]Evaluation complete![/bold green]")
        self._print_summary()
    
    async def _save_results(self):
        """Save evaluation results"""
        self.config.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save predictions
        predictions_file = self.config.output_dir / "predictions.json"
        with open(predictions_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        console.print(f"Results saved to: {predictions_file}")
    
    def _print_summary(self):
        """Print evaluation summary"""
        total = len(self.results)
        successful = sum(1 for r in self.results if 'error' not in r)
        validated = sum(1 for r in self.results if r.get('validation', {}).get('tests_pass', False))
        
        console.print("\n[bold]Evaluation Summary:[/bold]")
        console.print(f"Total instances: {total}")
        console.print(f"Successfully processed: {successful}")
        console.print(f"Tests passing: {validated}")
        console.print(f"Success rate: {validated/total*100:.1f}%")


@click.command()
@click.option('--dataset-name', default='princeton-nlp/SWE-bench_Lite', help='Dataset to evaluate')
@click.option('--num-workers', default=4, help='Number of parallel workers')
@click.option('--max-instances', type=int, help='Maximum number of instances to process')
@click.option('--agent-strategy', default='advanced', type=click.Choice(['basic', 'advanced', 'custom']))
@click.option('--use-task-manager', is_flag=True, help='Enable ACF task manager')
@click.option('--output-dir', default='./results', help='Output directory for results')
@click.option('--verbose', is_flag=True, help='Enable verbose logging')
@click.option('--config', default='config.yaml', help='Path to configuration file')
def main(dataset_name, num_workers, max_instances, agent_strategy, use_task_manager, output_dir, verbose, config):
    """Run SWE-bench evaluation with ACF MCP integration"""
    
    # Setup logging
    if verbose:
        logger.add(sys.stderr, level="DEBUG")
    else:
        logger.add(sys.stderr, level="INFO")
    
    # Load or create config
    if Path(config).exists():
        eval_config = EvaluationConfig.from_yaml(config)
        # Override with CLI args if provided
        eval_config.dataset_name = dataset_name
        eval_config.num_workers = num_workers
        eval_config.max_instances = max_instances
        eval_config.agent_strategy = agent_strategy
        eval_config.use_task_manager = use_task_manager
        eval_config.output_dir = Path(output_dir)
        eval_config.verbose = verbose
    else:
        eval_config = EvaluationConfig(
            dataset_name=dataset_name,
            num_workers=num_workers,
            max_instances=max_instances,
            agent_strategy=agent_strategy,
            use_task_manager=use_task_manager,
            output_dir=Path(output_dir),
            verbose=verbose
        )
    
    # Run evaluation
    evaluator = SWEBenchEvaluator(eval_config)
    asyncio.run(evaluator.run())


if __name__ == "__main__":
    main()
