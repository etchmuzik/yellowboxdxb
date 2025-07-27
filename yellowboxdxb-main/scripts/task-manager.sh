#\!/bin/bash

# Yellow Box Task Manager - Orchestrates sub-agents for critical tasks

YELLOW='\033[1;33m'
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

function show_dashboard() {
    clear
    echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║${YELLOW}                    YELLOW BOX TASK MANAGER                   ${NC}${BOLD}║${NC}"
    echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BOLD}Task Status Dashboard${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BOLD}TASK ID    STATUS NAME                           PRIORITY   PROGRESS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo -e "TASK-001   ✅     Code Quality & Console Cleanup  critical   100%"
    echo -e "TASK-002   🔴     Production Environment Setup    critical   0%"
    echo -e "TASK-003   🔴     Firebase Security Rules         critical   0%"
    echo -e "TASK-004   🟡     PWA Features Implementation     high       40%"
    echo -e "TASK-005   🔴     Error Handling & Loading        high       0%"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${BOLD}Progress Summary:${NC}"
    echo "🔥 Critical Tasks: 1/3 in progress, 2/3 pending"
    echo "⚡ High Priority: 1/2 in progress, 1/2 pending"
    echo ""
    echo -e "${BOLD}Recommended Next Actions:${NC}"
    echo "1. Run: ${GREEN}./scripts/task-manager.sh start-critical${NC}"
    echo "2. Monitor: ${GREEN}./scripts/task-manager.sh status${NC}"
    echo "3. Check logs: ${GREEN}tail -f logs/*.log${NC}"
}

function start_critical() {
    echo -e "${BOLD}${YELLOW}Starting Critical Path Tasks...${NC}"
    echo ""
    
    # Start TASK-001: Console Cleanup
    echo -e "${BLUE}[Sub-Agent-1]${NC} Starting TASK-001: Code Quality & Console Cleanup"
    bash scripts/sub-agents/task-001-console-cleanup.sh > logs/task-001-output.log 2>&1 &
    PID1=$\!
    echo "  → Process ID: $PID1"
    
    # Start TASK-002: Environment Setup
    echo -e "${BLUE}[Sub-Agent-2]${NC} Starting TASK-002: Production Environment Setup"
    bash scripts/sub-agents/task-002-env-setup.sh > logs/task-002-output.log 2>&1 &
    PID2=$\!
    echo "  → Process ID: $PID2"
    
    # Start TASK-003: Security Rules
    echo -e "${BLUE}[Sub-Agent-3]${NC} Starting TASK-003: Firebase Security Rules"
    bash scripts/sub-agents/task-003-security-rules.sh > logs/task-003-output.log 2>&1 &
    PID3=$\!
    echo "  → Process ID: $PID3"
    
    echo ""
    echo -e "${GREEN}✓ Critical tasks started.${NC}"
    echo ""
    echo "Monitor progress with:"
    echo "  ${GREEN}./scripts/task-manager.sh status${NC}"
    echo "  ${GREEN}tail -f logs/*.log${NC}"
}

function check_status() {
    echo -e "${BOLD}Checking Task Status...${NC}"
    echo ""
    
    # Check if log files exist
    if [ -f "logs/task-001.log" ]; then
        echo -e "${BLUE}TASK-001 (Console Cleanup):${NC}"
        tail -n 3 logs/task-001.log
        echo ""
    fi
    
    if [ -f "logs/task-002.log" ]; then
        echo -e "${BLUE}TASK-002 (Environment Setup):${NC}"
        tail -n 3 logs/task-002.log
        echo ""
    fi
    
    if [ -f "logs/task-003.log" ]; then
        echo -e "${BLUE}TASK-003 (Security Rules):${NC}"
        tail -n 3 logs/task-003.log
        echo ""
    fi
    
    # Check completion log
    if [ -f "logs/task-completion.log" ]; then
        echo -e "${BOLD}${GREEN}Completed Tasks:${NC}"
        cat logs/task-completion.log
    fi
}

# Main command handler
case "$1" in
    dashboard)
        show_dashboard
        ;;
    start-critical)
        start_critical
        ;;
    status)
        check_status
        ;;
    *)
        echo "Usage: $0 {dashboard|start-critical|status}"
        echo ""
        echo "Commands:"
        echo "  dashboard      - Show task status dashboard"
        echo "  start-critical - Start all critical path tasks"
        echo "  status         - Check running task status"
        exit 1
        ;;
esac
