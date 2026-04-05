@echo off
REM Test runner script for Selectra AI Recruitment Platform (Windows)

setlocal enabledelayedexpansion

REM Colors (Windows 10+ supports ANSI codes)
set YELLOW=[1;33m
set GREEN=[0;32m
set RED=[0;31m
set NC=[0m

REM Check if no arguments provided
if "%1"=="" (
    echo Running all tests...
    pytest
    goto :end
)

if /i "%1"=="backend" (
    echo Running backend tests...
    pytest tests/backend/ -v
    goto :end
)

if /i "%1"=="flask" (
    echo Running Flask service tests...
    pytest tests/flask_services/ -v
    goto :end
)

if /i "%1"=="unit" (
    echo Running unit tests...
    pytest -m unit -v
    goto :end
)

if /i "%1"=="coverage" (
    echo Running tests with coverage report...
    pytest --cov=. --cov-report=html --cov-report=term
    echo Coverage report generated in htmlcov/index.html
    goto :end
)

if /i "%1"=="watch" (
    echo Running tests in watch mode...
    ptw tests/
    goto :end
)

if /i "%1"=="help" (
    echo Test Runner for Selectra AI Recruitment Platform
    echo.
    echo Usage: run_tests.bat [option]
    echo.
    echo Options:
    echo     all         Run all tests (default)
    echo     backend     Run only backend/Django tests
    echo     flask       Run only Flask service tests
    echo     unit        Run only unit tests
    echo     coverage    Run tests with coverage report
    echo     watch       Run tests in watch mode (requires pytest-watch)
    echo     help        Show this help message
    echo     [path]      Run specific test file/class/method
    echo.
    echo Examples:
    echo     run_tests.bat                          # Run all tests
    echo     run_tests.bat backend                  # Run backend tests only
    echo     run_tests.bat coverage                 # Generate coverage report
    echo     run_tests.bat tests\backend\test_models.py  # Run specific file
    goto :end
)

REM If we get here, treat as specific test path
echo Running specific test: %1
pytest %1 -v

:end
endlocal
