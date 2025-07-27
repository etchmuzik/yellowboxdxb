# Yellow Box - Tmux Orchestrator Integration Guide

## 🎯 Overview

This integration combines the power of [Tmux-Orchestrator](https://github.com/Jedward23/Tmux-Orchestrator) with your Yellow Box automation system to create a comprehensive, organized development environment.

## 🚀 What You Get

A complete tmux session with organized panes for:

### 📊 **Main Dashboard** (Window: main)
- **Project Overview**: System status, quick links, available commands
- **System Monitor**: Real-time monitoring of processes and resources

### 🤖 **n8n Automation** (Window: n8n)
- **n8n Server**: Running n8n automation server
- **n8n Logs**: Real-time log monitoring

### 🔥 **Firebase Services** (Window: firebase)
- **Firebase Emulator**: Local development environment
- **Functions Development**: Firebase Functions development tools

### 📊 **Data Management** (Window: data)
- **Google Sheets Setup**: Integration setup and monitoring
- **Data Sync Monitor**: Real-time data synchronization status

### ⚛️ **Development** (Window: dev)
- **App Development**: React app development server
- **Testing**: Quality assurance and testing tools

### 🔄 **Automation Management** (Window: automation)
- **Workflow Status**: Monitor all 4 automation workflows
- **Automation Logs**: Real-time automation activity logs

## 🛠️ Quick Start

### 1. One-Command Setup
```bash
chmod +x start-automation-environment.sh
./start-automation-environment.sh
```

This script will:
- ✅ Check all prerequisites
- ✅ Install Tmux-Orchestrator if needed
- ✅ Set up project dependencies
- ✅ Create the complete tmux environment
- ✅ Start all services automatically

### 2. Manual Setup (Alternative)
If you prefer manual control:

```bash
# Install Tmux-Orchestrator
git clone https://github.com/Jedward23/Tmux-Orchestrator.git
cd Tmux-Orchestrator
cargo install --path .  # or use provided install script

# Return to Yellow Box project
cd /path/to/yellowboxdxb-main

# Start the orchestrated session
tmux-orchestrator --config tmux-orchestrator-config.yaml
```

## 🎮 Navigation & Hotkeys

### Window Navigation
- **Prefix + M**: Switch to Main dashboard
- **Prefix + N**: Switch to n8n automation
- **Prefix + F**: Switch to Firebase services
- **Prefix + D**: Switch to Data management
- **Prefix + A**: Switch to Automation management

### Custom Commands
Run these commands from any pane:

- **`setup`**: Run complete automation setup
- **`import`**: Show workflow import guide
- **`monitor`**: Monitor workflow status
- **`deploy`**: Deploy automation system
- **`status`**: Show system status

### Example Usage
```bash
# In any tmux pane, run:
setup     # Configure credentials interactively
import    # Get workflow import instructions
monitor   # Check automation status
```

## 📋 Session Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Window: main                                                │
├─────────────────────────┬───────────────────────────────────┤
│ Project Overview        │ System Monitor                    │
│ - System status         │ - Process monitoring              │
│ - Quick links           │ - Resource usage                  │
│ - Available commands    │ - Real-time updates               │
└─────────────────────────┴───────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Window: n8n                                                 │
├─────────────────────────┬───────────────────────────────────┤
│ n8n Server              │ n8n Logs                          │
│ - Running n8n           │ - Real-time logs                  │
│ - Port 5678             │ - Error monitoring                │
│ - Status updates        │ - Execution history               │
└─────────────────────────┴───────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Window: firebase                                            │
├─────────────────────────┬───────────────────────────────────┤
│ Firebase Emulator       │ Functions Development             │
│ - Local development     │ - Function deployment             │
│ - Emulator controls     │ - Function logs                   │
│ - Project status        │ - Development tools               │
└─────────────────────────┴───────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Window: data                                                │
├─────────────────────────┬───────────────────────────────────┤
│ Google Sheets Setup     │ Data Sync Monitor                 │
│ - Setup checklist       │ - Sync status                     │
│ - Configuration guide   │ - Data flow monitoring            │
│ - Credential management │ - Error tracking                  │
└─────────────────────────┴───────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Window: automation                                          │
├─────────────────────────┬───────────────────────────────────┤
│ Workflow Status         │ Automation Logs                   │
│ - 4 workflow statuses   │ - Real-time activity              │
│ - Execution monitoring  │ - Error logs                      │
│ - Management commands   │ - Performance metrics             │
└─────────────────────────┴───────────────────────────────────┘
```

## 🔧 Configuration

### Environment Variables
The session automatically sets:
- `PROJECT_NAME`: "Yellow Box"
- `NODE_ENV`: "development"
- `N8N_PORT`: "5678"
- `FIREBASE_PROJECT`: "yellowbox-8e0e6"

### Customization
Edit `tmux-orchestrator-config.yaml` to:
- Add new windows/panes
- Modify startup commands
- Change hotkey bindings
- Add custom commands
- Adjust layouts

## 🎯 Workflow Integration

### Automated Startup Sequence
1. **Main dashboard** loads first with project overview
2. **n8n server** starts automatically (2-second delay)
3. **System monitor** begins real-time monitoring
4. All other windows are prepared and ready

### Workflow Management
The automation window provides direct access to:
- **Real-time Data Sync**: `e91V8Vqp3fxl80PS`
- **Scheduled Data Backup**: `mpchfdzgAVmAVlVU`
- **Health Monitoring**: `yz8EHQamhw1mb8Sx`
- **Data Integrity Check**: `LGoTcdR0z8xMHYSW`

## 🔍 Monitoring & Debugging

### Real-time Monitoring
- **System Monitor**: Process and resource monitoring
- **n8n Logs**: Automation server logs
- **Automation Logs**: Workflow execution logs
- **Data Sync Monitor**: Google Sheets integration status

### Debugging Tools
- Access to all log files in real-time
- Process monitoring for troubleshooting
- Quick access to configuration files
- Integrated testing environment

## 🛡️ Session Management

### Session Persistence
- Session name: `yellowbox-automation`
- Survives disconnections
- Can be reattached from anywhere

### Cleanup
The session includes automatic cleanup:
- Stops n8n processes on exit
- Cleans up temporary files
- Provides clean shutdown

### Reattaching
If disconnected, reattach with:
```bash
tmux attach-session -t yellowbox-automation
```

## 🎨 Benefits of This Setup

### 🚀 **Productivity**
- Everything in one organized view
- Quick navigation between tools
- Automated startup sequence
- Custom commands for common tasks

### 👀 **Visibility**
- Real-time monitoring of all services
- Immediate feedback on system status
- Centralized log viewing
- Visual organization of workflows

### 🔧 **Efficiency**
- No need to manage multiple terminal windows
- Consistent development environment
- Automated service startup
- Integrated tooling

### 📊 **Professional**
- Clean, organized interface
- Easy to share with team members
- Reproducible environment setup
- Documentation integrated into session

## 🆘 Troubleshooting

### Common Issues

**Tmux-Orchestrator not found:**
```bash
# Install manually
git clone https://github.com/Jedward23/Tmux-Orchestrator.git
cd Tmux-Orchestrator
cargo install --path .
```

**Session won't start:**
```bash
# Check tmux is installed
tmux --version

# Kill existing session
tmux kill-session -t yellowbox-automation

# Restart
./start-automation-environment.sh
```

**n8n won't start:**
```bash
# Check if port 5678 is available
lsof -i :5678

# Install n8n globally
npm install -g n8n
```

### Getting Help
- Check session notes: Built into tmux configuration
- Review logs: Available in real-time in dedicated panes
- Use custom commands: `status` command shows system overview

## 🎉 Next Steps

Once your environment is running:

1. **Configure Credentials**: Run `setup` command
2. **Import Workflows**: Run `import` command  
3. **Monitor System**: Use `monitor` command
4. **Access n8n**: Open http://localhost:5678
5. **Navigate Efficiently**: Use hotkeys (Prefix + M/N/F/D/A)

Your Yellow Box automation system is now running in a professional, organized development environment! 🚀