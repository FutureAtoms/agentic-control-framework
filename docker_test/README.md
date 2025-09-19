# Docker Test Files

This directory contains Docker configurations specifically for testing the ACF framework in different environments.

## Test Dockerfiles

### Dockerfile.test
Standard test environment for running the complete ACF test suite.

### Dockerfile.test-cli
Specialized configuration for testing ACF in CLI mode without GUI dependencies.

### Dockerfile.test-windows
Windows-compatible Docker configuration for cross-platform testing.

## Usage

```bash
# Build and run standard tests
docker build -f docker_test/Dockerfile.test -t acf-test .
docker run acf-test

# CLI-only tests
docker build -f docker_test/Dockerfile.test-cli -t acf-test-cli .
docker run acf-test-cli

# Windows environment tests
docker build -f docker_test/Dockerfile.test-windows -t acf-test-windows .
docker run acf-test-windows
```

## Note
These Dockerfiles are for testing purposes only. For production deployments, use the Dockerfiles in the `deployment/docker/` directory.