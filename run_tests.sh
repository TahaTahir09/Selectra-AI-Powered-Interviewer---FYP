#!/bin/bash
# Test runner script for Selectra AI Recruitment Platform

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
run_all_tests() {
    echo -e "${YELLOW}Running all tests...${NC}"
    pytest
}

run_backend_tests() {
    echo -e "${YELLOW}Running backend tests...${NC}"
    pytest tests/backend/ -v
}

run_flask_tests() {
    echo -e "${YELLOW}Running Flask service tests...${NC}"
    pytest tests/flask_services/ -v
}

run_unit_tests() {
    echo -e "${YELLOW}Running unit tests...${NC}"
    pytest -m unit -v
}

run_coverage() {
    echo -e "${YELLOW}Running tests with coverage report...${NC}"
    pytest --cov=. --cov-report=html --cov-report=term
    echo -e "${GREEN}Coverage report generated in htmlcov/index.html${NC}"
}

run_watch() {
    echo -e "${YELLOW}Running tests in watch mode...${NC}"
    ptw tests/
}

run_specific_test() {
    echo -e "${YELLOW}Running specific test: $1${NC}"
    pytest "$1" -v
}

show_help() {
    cat << EOF
Test Runner for Selectra AI Recruitment Platform

Usage: ./run_tests.sh [option]

Options:
    all         Run all tests (default)
    backend     Run only backend/Django tests
    flask       Run only Flask service tests
    unit        Run only unit tests
    coverage    Run tests with coverage report
    watch       Run tests in watch mode (requires pytest-watch)
    help        Show this help message
    <path>      Run specific test file/class/method
                Example: ./run_tests.sh tests/backend/test_models.py

Examples:
    ./run_tests.sh                          # Run all tests
    ./run_tests.sh backend                  # Run backend tests only
    ./run_tests.sh coverage                 # Generate coverage report
    ./run_tests.sh tests/backend/test_models.py::TestJobPost  # Run specific class

EOF
}

# Main script
if [ $# -eq 0 ]; then
    run_all_tests
else
    case "$1" in
        backend)
            run_backend_tests
            ;;
        flask)
            run_flask_tests
            ;;
        unit)
            run_unit_tests
            ;;
        coverage)
            run_coverage
            ;;
        watch)
            run_watch
            ;;
        help)
            show_help
            ;;
        *)
            run_specific_test "$1"
            ;;
    esac
fi
