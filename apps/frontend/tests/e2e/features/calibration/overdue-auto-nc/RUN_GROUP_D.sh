#!/bin/bash
# Group D: Frontend UI Tests - Quick Run Script
# 
# This script provides convenient commands for running Group D tests
# (Incident History Tab Integration - 8 tests)

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base path
TEST_FILE="apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts"
SEED_FILE="apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-data/seed-incident-history.spec.ts"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Group D: Frontend UI Tests Runner${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to run seed
run_seed() {
    echo -e "${YELLOW}Running seed file...${NC}"
    npx playwright test "$SEED_FILE" --project=chromium
    echo -e "${GREEN}✓ Seed complete${NC}"
    echo ""
}

# Function to run all tests
run_all() {
    echo -e "${YELLOW}Running all 8 UI tests (parallel)...${NC}"
    npx playwright test "$TEST_FILE" --project=chromium --workers=8
    echo -e "${GREEN}✓ All tests complete${NC}"
}

# Function to run specific test
run_specific() {
    local test_num=$1
    echo -e "${YELLOW}Running test 4.${test_num}...${NC}"
    npx playwright test "$TEST_FILE" --project=chromium -g "4.${test_num}"
    echo -e "${GREEN}✓ Test 4.${test_num} complete${NC}"
}

# Function to run with UI mode
run_ui_mode() {
    echo -e "${YELLOW}Opening Playwright UI mode...${NC}"
    npx playwright test "$TEST_FILE" --ui
}

# Function to run with debug
run_debug() {
    local test_num=$1
    echo -e "${YELLOW}Running test 4.${test_num} in debug mode...${NC}"
    PWDEBUG=1 npx playwright test "$TEST_FILE" --project=chromium -g "4.${test_num}"
}

# Parse command line arguments
case "${1}" in
    seed)
        run_seed
        ;;
    all)
        run_all
        ;;
    1|2|3|4|5|6|7|8)
        run_specific "${1}"
        ;;
    ui)
        run_ui_mode
        ;;
    debug)
        if [ -z "${2}" ]; then
            echo -e "${YELLOW}Usage: ./RUN_GROUP_D.sh debug [1-8]${NC}"
            exit 1
        fi
        run_debug "${2}"
        ;;
    *)
        echo "Group D: Frontend UI Tests - Incident History Tab Integration"
        echo ""
        echo "Usage: ./RUN_GROUP_D.sh [command]"
        echo ""
        echo "Commands:"
        echo "  seed          Run seed file to verify equipment exists"
        echo "  all           Run all 8 tests in parallel (default)"
        echo "  1-8           Run specific test (e.g., './RUN_GROUP_D.sh 1')"
        echo "  ui            Open Playwright UI mode for interactive testing"
        echo "  debug [1-8]   Run specific test in debug mode with inspector"
        echo ""
        echo "Examples:"
        echo "  ./RUN_GROUP_D.sh seed            # Verify test data"
        echo "  ./RUN_GROUP_D.sh all             # Run all 8 tests"
        echo "  ./RUN_GROUP_D.sh 1               # Run test 4.1 only"
        echo "  ./RUN_GROUP_D.sh ui              # Interactive mode"
        echo "  ./RUN_GROUP_D.sh debug 5         # Debug test 4.5"
        echo ""
        echo "Test List:"
        echo "  4.1 - Display calibration_overdue option in dropdown"
        echo "  4.2 - Show non-conformance checkbox for calibration_overdue"
        echo "  4.3 - Show action plan field when checkbox checked"
        echo "  4.4 - Hide checkbox for Change/Repair types"
        echo "  4.5 - Successfully create incident with non-conformance"
        echo "  4.6 - Display incidents with purple badge styling"
        echo "  4.7 - Validate required fields"
        echo "  4.8 - Enforce 500 character content limit"
        echo ""
        
        # Run all tests by default
        run_all
        ;;
esac
