#!/usr/bin/env python3
"""
Test a single SWE-bench instance with ACF MCP

This script allows you to test the integration with a single instance
for debugging and development purposes.
"""

import asyncio
import json
import sys
from pathlib import Path

import click
from datasets import load_dataset
from loguru import logger
from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax

# Import from main evaluation script
sys.path.insert(0, str(Path(__file__).parent))
from run_evaluation import ACFMCPClient, SWEBenchAgent

console = Console()


async def test_single_instance(instance_id: str, dataset_name: str = "princeton-nlp/SWE-bench_Lite", verbose: bool = False):
    """Test a single SWE-bench instance"""
    
    # Setup logging
    if verbose:
        logger.add(sys.stderr, level="DEBUG")
    else:
        logger.add(sys.stderr, level="INFO")
    
    console.print(f"[bold]Testing instance: {instance_id}[/bold]")
    
    # Load dataset and find instance
    dataset = load_dataset(dataset_name, split='test')
    instance = None
    
    for item in dataset:
        if item['instance_id'] == instance_id:
            instance = item
            break
    
    if not instance:
        console.print(f"[red]Instance {instance_id} not found in {dataset_name}[/red]")
        return
    
    # Display instance information
    console.print(Panel.fit(
        f"[bold]Repository:[/bold] {instance['repo']}\n"
        f"[bold]Version:[/bold] {instance.get('version', 'N/A')}\n"
        f"[bold]Problem Statement:[/bold]\n{instance['problem_statement'][:500]}...",
        title=f"Instance: {instance_id}"
    ))
    
    # Initialize ACF client and agent
    acf_client = ACFMCPClient()
    agent = SWEBenchAgent(acf_client, strategy="advanced")
    
    # Connect to ACF server
    connected = await acf_client.connect()
    if not connected:
        console.print("[bold red]Failed to connect to ACF MCP server![/bold red]")
        console.print("Please run: npm run start:mcp")
        return
    
    console.print("[green]Connected to ACF MCP server[/green]")
    
    # Test ACF tools
    console.print("\n[bold]Testing ACF Tools:[/bold]")
    
    # Test workspace setup
    try:
        workspace_result = await acf_client.call_tool("setWorkspace", {
            "workspacePath": f"/tmp/swebench_test/{instance_id}"
        })
        console.print("✓ Workspace setup: Success")
    except Exception as e:
        console.print(f"✗ Workspace setup: Failed - {e}")
        return
    
    # Test file operations
    try:
        test_file = "/tmp/swebench_test/test.py"
        await acf_client.call_tool("write_file", {
            "path": test_file,
            "content": "# Test file\nprint('Hello from ACF')"
        })
        
        read_result = await acf_client.call_tool("read_file", {"path": test_file})
        console.print("✓ File operations: Success")
    except Exception as e:
        console.print(f"✗ File operations: Failed - {e}")
    
    # Test code search
    try:
        search_result = await acf_client.call_tool("search_code", {
            "path": "/tmp/swebench_test",
            "pattern": "print",
            "maxResults": 10
        })
        console.print("✓ Code search: Success")
    except Exception as e:
        console.print(f"✗ Code search: Failed - {e}")
    
    # Test task management
    try:
        task_result = await acf_client.call_tool("addTask", {
            "title": f"Test task for {instance_id}",
            "description": "Testing ACF task management",
            "priority": "medium"
        })
        console.print("✓ Task management: Success")
    except Exception as e:
        console.print(f"✗ Task management: Failed - {e}")
    
    # Run the actual solving process
    console.print("\n[bold]Attempting to solve instance...[/bold]")
    
    try:
        result = await agent.solve_instance(instance)
        
        # Display results
        console.print("\n[bold green]Solution Generated![/bold green]")
        
        if result.get('model_patch'):
            console.print("\n[bold]Generated Patch:[/bold]")
            syntax = Syntax(result['model_patch'][:1000], "diff", theme="monokai")
            console.print(syntax)
        
        if result.get('validation'):
            console.print("\n[bold]Validation Results:[/bold]")
            validation = result['validation']
            console.print(f"Tests Pass: {'✓' if validation['tests_pass'] else '✗'}")
            if validation.get('output'):
                console.print(f"Output: {validation['output'][:500]}")
        
        # Save result
        output_file = Path(f"test_result_{instance_id.replace('/', '_')}.json")
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        console.print(f"\nResult saved to: {output_file}")
        
    except Exception as e:
        console.print(f"[red]Error solving instance: {e}[/red]")
        logger.exception("Detailed error:")
    
    # Cleanup
    await acf_client.close()
    console.print("\n[green]Test complete![/green]")


@click.command()
@click.argument('instance_id')
@click.option('--dataset', default='princeton-nlp/SWE-bench_Lite', help='Dataset name')
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose output')
def main(instance_id, dataset, verbose):
    """Test a single SWE-bench instance with ACF MCP
    
    Example:
        python test_single.py sympy__sympy-20590 --verbose
    """
    asyncio.run(test_single_instance(instance_id, dataset, verbose))


if __name__ == "__main__":
    main()
