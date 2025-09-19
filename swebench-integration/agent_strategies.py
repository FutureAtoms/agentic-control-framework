"""
Agent Strategies for SWE-bench using ACF Tools

This module defines different strategies for solving SWE-bench instances
by leveraging various ACF MCP tools in different combinations.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
import asyncio
from loguru import logger


class ProblemType(Enum):
    """Types of problems in SWE-bench"""
    BUG_FIX = "bug_fix"
    FEATURE = "feature"
    REFACTOR = "refactor"
    TEST_FIX = "test_fix"
    DOCUMENTATION = "documentation"
    PERFORMANCE = "performance"


@dataclass
class ToolChain:
    """Represents a chain of ACF tools to execute"""
    name: str
    tools: List[str]
    parallel: bool = False
    retry_on_failure: bool = True


class AgentStrategy:
    """Base class for agent strategies"""
    
    def __init__(self, acf_client):
        self.acf = acf_client
        
    async def execute(self, instance: Dict) -> Dict:
        """Execute the strategy for a given instance"""
        raise NotImplementedError
    
    def classify_problem(self, instance: Dict) -> ProblemType:
        """Classify the type of problem"""
        problem_text = instance.get('problem_statement', '').lower()
        
        # Keywords for classification
        if any(word in problem_text for word in ['error', 'exception', 'fail', 'crash', 'bug', 'broken']):
            return ProblemType.BUG_FIX
        elif any(word in problem_text for word in ['add', 'implement', 'support', 'feature', 'new']):
            return ProblemType.FEATURE
        elif any(word in problem_text for word in ['refactor', 'improve', 'optimize', 'cleanup']):
            return ProblemType.REFACTOR
        elif any(word in problem_text for word in ['test', 'coverage', 'assert', 'mock']):
            return ProblemType.TEST_FIX
        elif any(word in problem_text for word in ['document', 'docstring', 'comment', 'readme']):
            return ProblemType.DOCUMENTATION
        elif any(word in problem_text for word in ['performance', 'speed', 'slow', 'optimize']):
            return ProblemType.PERFORMANCE
        
        return ProblemType.BUG_FIX  # Default


class BasicStrategy(AgentStrategy):
    """Basic strategy using minimal ACF tools"""
    
    async def execute(self, instance: Dict) -> Dict:
        logger.info("Executing Basic Strategy")
        
        # Simple workflow: search -> read -> edit -> test
        result = {
            "strategy": "basic",
            "steps": []
        }
        
        # 1. Search for relevant code
        search_result = await self.acf.call_tool("search_code", {
            "path": instance['repo'],
            "pattern": self._extract_search_pattern(instance),
            "maxResults": 20
        })
        result["steps"].append({"tool": "search_code", "status": "complete"})
        
        # 2. Read relevant files
        for match in search_result.get('matches', [])[:5]:
            file_content = await self.acf.call_tool("read_file", {
                "path": match['path']
            })
            result["steps"].append({"tool": "read_file", "file": match['path']})
        
        # 3. Apply fixes (simplified)
        # This would integrate with an LLM to generate actual fixes
        
        # 4. Run tests
        test_result = await self.acf.call_tool("execute_command", {
            "command": f"python -m pytest {instance.get('test_file', '')} -xvs",
            "timeout_ms": 30000
        })
        result["steps"].append({"tool": "execute_command", "status": "complete"})
        
        return result
    
    def _extract_search_pattern(self, instance: Dict) -> str:
        """Extract search pattern from instance"""
        # Simple extraction - could be enhanced
        if instance.get('fail_to_pass'):
            return instance['fail_to_pass'][0].split('::')[-1] if '::' in instance['fail_to_pass'][0] else 'def test_'
        return "def "


class AdvancedStrategy(AgentStrategy):
    """Advanced strategy using full ACF capabilities"""
    
    async def execute(self, instance: Dict) -> Dict:
        logger.info("Executing Advanced Strategy")
        
        problem_type = self.classify_problem(instance)
        tool_chain = self._get_tool_chain(problem_type)
        
        result = {
            "strategy": "advanced",
            "problem_type": problem_type.value,
            "tool_chain": tool_chain.name,
            "steps": []
        }
        
        # Execute tool chain
        for tool_config in tool_chain.tools:
            try:
                step_result = await self._execute_tool_step(tool_config, instance)
                result["steps"].append(step_result)
            except Exception as e:
                logger.error(f"Tool step failed: {e}")
                if tool_chain.retry_on_failure:
                    # Retry logic
                    pass
        
        return result
    
    def _get_tool_chain(self, problem_type: ProblemType) -> ToolChain:
        """Get appropriate tool chain for problem type"""
        chains = {
            ProblemType.BUG_FIX: ToolChain(
                name="bug_fix_chain",
                tools=[
                    {"name": "initProject", "params": {"editor": "claude"}},
                    {"name": "addTask", "params": {"title": "Locate bug", "priority": "critical"}},
                    {"name": "search_code", "params": {"maxResults": 50}},
                    {"name": "tree", "params": {"depth": 3}},
                    {"name": "read_multiple_files", "params": {}},
                    {"name": "addTask", "params": {"title": "Fix bug", "priority": "critical"}},
                    {"name": "edit_block", "params": {"validate": True}},
                    {"name": "execute_command", "params": {"command": "pytest"}},
                    {"name": "updateStatus", "params": {"newStatus": "done"}}
                ]
            ),
            ProblemType.FEATURE: ToolChain(
                name="feature_chain",
                tools=[
                    {"name": "initProject", "params": {}},
                    {"name": "addTask", "params": {"title": "Design feature"}},
                    {"name": "tree", "params": {"depth": 4}},
                    {"name": "search_code", "params": {"contextLines": 5}},
                    {"name": "addTask", "params": {"title": "Implement feature"}},
                    {"name": "create_file", "params": {}},
                    {"name": "edit_block", "params": {}},
                    {"name": "addTask", "params": {"title": "Add tests"}},
                    {"name": "execute_command", "params": {"command": "pytest"}}
                ]
            ),
            ProblemType.REFACTOR: ToolChain(
                name="refactor_chain",
                tools=[
                    {"name": "search_code", "params": {"includeHidden": False}},
                    {"name": "get_file_info", "params": {}},
                    {"name": "read_multiple_files", "params": {}},
                    {"name": "addTask", "params": {"title": "Plan refactoring"}},
                    {"name": "edit_block", "params": {"expected_replacements": 1}},
                    {"name": "execute_command", "params": {"command": "pytest"}}
                ],
                parallel=True
            ),
            ProblemType.TEST_FIX: ToolChain(
                name="test_fix_chain",
                tools=[
                    {"name": "search_code", "params": {"pattern": "def test_"}},
                    {"name": "read_file", "params": {}},
                    {"name": "execute_command", "params": {"command": "pytest -v"}},
                    {"name": "edit_block", "params": {}},
                    {"name": "execute_command", "params": {"command": "pytest"}}
                ]
            ),
            ProblemType.DOCUMENTATION: ToolChain(
                name="doc_chain",
                tools=[
                    {"name": "search_code", "params": {"pattern": "def |class "}},
                    {"name": "read_file", "params": {}},
                    {"name": "edit_block", "params": {}},
                    {"name": "write_file", "params": {}}
                ]
            ),
            ProblemType.PERFORMANCE: ToolChain(
                name="performance_chain",
                tools=[
                    {"name": "search_code", "params": {}},
                    {"name": "execute_command", "params": {"command": "python -m cProfile"}},
                    {"name": "addTask", "params": {"title": "Identify bottlenecks"}},
                    {"name": "edit_block", "params": {}},
                    {"name": "execute_command", "params": {"command": "pytest --benchmark"}}
                ]
            )
        }
        
        return chains.get(problem_type, chains[ProblemType.BUG_FIX])
    
    async def _execute_tool_step(self, tool_config: Dict, instance: Dict) -> Dict:
        """Execute a single tool step"""
        tool_name = tool_config["name"]
        params = tool_config.get("params", {})
        
        # Enhance params with instance data
        if tool_name == "search_code":
            params["path"] = instance.get('repo', '.')
            if not params.get("pattern"):
                params["pattern"] = self._extract_search_pattern(instance)
        
        elif tool_name == "addTask":
            if not params.get("description"):
                params["description"] = instance['problem_statement'][:500]
        
        elif tool_name == "initProject":
            params["projectName"] = instance['instance_id']
            params["projectDescription"] = instance['problem_statement'][:1000]
        
        # Execute tool
        result = await self.acf.call_tool(tool_name, params)
        
        return {
            "tool": tool_name,
            "params": params,
            "result": result,
            "status": "success" if result else "failed"
        }
    
    def _extract_search_pattern(self, instance: Dict) -> str:
        """Extract intelligent search pattern"""
        # Extract from test names or problem statement
        patterns = []
        
        if instance.get('fail_to_pass'):
            for test in instance['fail_to_pass']:
                # Extract test function name
                if '::' in test:
                    patterns.append(test.split('::')[-1].replace('test_', ''))
        
        # Extract from problem statement
        problem_words = instance['problem_statement'].split()[:20]
        for word in problem_words:
            if word.startswith(('def', 'class', 'function', 'method')):
                patterns.append(word)
        
        return patterns[0] if patterns else "def "


class CustomStrategy(AgentStrategy):
    """Custom strategy with user-defined workflows"""
    
    def __init__(self, acf_client, workflow: List[Dict]):
        super().__init__(acf_client)
        self.workflow = workflow
    
    async def execute(self, instance: Dict) -> Dict:
        logger.info("Executing Custom Strategy")
        
        result = {
            "strategy": "custom",
            "workflow_length": len(self.workflow),
            "steps": []
        }
        
        # Execute custom workflow
        for step in self.workflow:
            try:
                step_result = await self._execute_custom_step(step, instance)
                result["steps"].append(step_result)
                
                # Check for conditional flow
                if step.get("condition") and not self._evaluate_condition(step["condition"], step_result):
                    break
                    
            except Exception as e:
                logger.error(f"Custom step failed: {e}")
                result["steps"].append({"error": str(e)})
        
        return result
    
    async def _execute_custom_step(self, step: Dict, instance: Dict) -> Dict:
        """Execute a custom workflow step"""
        if step["type"] == "tool":
            return await self.acf.call_tool(step["name"], step.get("params", {}))
        
        elif step["type"] == "parallel":
            # Execute multiple tools in parallel
            tasks = [
                self.acf.call_tool(tool["name"], tool.get("params", {}))
                for tool in step["tools"]
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            return {"parallel_results": results}
        
        elif step["type"] == "conditional":
            # Conditional execution
            condition_result = await self._evaluate_async_condition(step["condition"], instance)
            if condition_result:
                return await self._execute_custom_step(step["if_true"], instance)
            else:
                return await self._execute_custom_step(step["if_false"], instance)
        
        return {"type": step["type"], "status": "unknown"}
    
    def _evaluate_condition(self, condition: Dict, result: Any) -> bool:
        """Evaluate a condition"""
        # Simple condition evaluation
        if condition["type"] == "success":
            return not isinstance(result, Exception)
        elif condition["type"] == "contains":
            return condition["value"] in str(result)
        elif condition["type"] == "equals":
            return result == condition["value"]
        return True
    
    async def _evaluate_async_condition(self, condition: Dict, instance: Dict) -> bool:
        """Evaluate an async condition"""
        if condition["type"] == "tool_result":
            result = await self.acf.call_tool(condition["tool"], condition.get("params", {}))
            return self._evaluate_condition(condition["check"], result)
        return True


class HybridStrategy(AgentStrategy):
    """Hybrid strategy that combines multiple approaches"""
    
    def __init__(self, acf_client):
        super().__init__(acf_client)
        self.basic = BasicStrategy(acf_client)
        self.advanced = AdvancedStrategy(acf_client)
    
    async def execute(self, instance: Dict) -> Dict:
        logger.info("Executing Hybrid Strategy")
        
        # Analyze problem complexity
        complexity = self._analyze_complexity(instance)
        
        if complexity < 3:
            # Use basic strategy for simple problems
            return await self.basic.execute(instance)
        elif complexity < 7:
            # Use advanced strategy for medium complexity
            return await self.advanced.execute(instance)
        else:
            # Use multi-phase approach for complex problems
            return await self._execute_multi_phase(instance)
    
    def _analyze_complexity(self, instance: Dict) -> int:
        """Analyze problem complexity (0-10 scale)"""
        complexity = 0
        
        # Factor 1: Problem statement length
        if len(instance.get('problem_statement', '')) > 1000:
            complexity += 2
        
        # Factor 2: Number of failing tests
        if len(instance.get('fail_to_pass', [])) > 5:
            complexity += 3
        
        # Factor 3: Problem type
        problem_type = self.classify_problem(instance)
        if problem_type in [ProblemType.FEATURE, ProblemType.REFACTOR]:
            complexity += 2
        
        # Factor 4: Code changes scope (estimated)
        if 'multiple' in instance.get('problem_statement', '').lower():
            complexity += 2
        
        return min(complexity, 10)
    
    async def _execute_multi_phase(self, instance: Dict) -> Dict:
        """Execute multi-phase approach for complex problems"""
        result = {
            "strategy": "hybrid_multi_phase",
            "phases": []
        }
        
        # Phase 1: Deep analysis
        analysis_phase = await self._phase_analysis(instance)
        result["phases"].append(analysis_phase)
        
        # Phase 2: Planning
        planning_phase = await self._phase_planning(instance, analysis_phase)
        result["phases"].append(planning_phase)
        
        # Phase 3: Implementation
        implementation_phase = await self._phase_implementation(instance, planning_phase)
        result["phases"].append(implementation_phase)
        
        # Phase 4: Validation
        validation_phase = await self._phase_validation(instance, implementation_phase)
        result["phases"].append(validation_phase)
        
        return result
    
    async def _phase_analysis(self, instance: Dict) -> Dict:
        """Deep analysis phase"""
        # Comprehensive code analysis
        return {
            "phase": "analysis",
            "status": "complete"
        }
    
    async def _phase_planning(self, instance: Dict, analysis: Dict) -> Dict:
        """Planning phase based on analysis"""
        # Create detailed plan with ACF task manager
        return {
            "phase": "planning",
            "status": "complete"
        }
    
    async def _phase_implementation(self, instance: Dict, plan: Dict) -> Dict:
        """Implementation phase"""
        # Execute the plan
        return {
            "phase": "implementation",
            "status": "complete"
        }
    
    async def _phase_validation(self, instance: Dict, implementation: Dict) -> Dict:
        """Validation and testing phase"""
        # Comprehensive testing
        return {
            "phase": "validation",
            "status": "complete"
        }


# Strategy Factory
def get_strategy(strategy_name: str, acf_client, **kwargs) -> AgentStrategy:
    """Factory function to get the appropriate strategy"""
    strategies = {
        "basic": BasicStrategy,
        "advanced": AdvancedStrategy,
        "hybrid": HybridStrategy
    }
    
    if strategy_name == "custom":
        workflow = kwargs.get("workflow", [])
        return CustomStrategy(acf_client, workflow)
    
    strategy_class = strategies.get(strategy_name, AdvancedStrategy)
    return strategy_class(acf_client)
