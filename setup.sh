#!/bin/bash

# Agentic Control Framework Setup Script
# This script configures the environment for the Agentic Control Framework

# Get the absolute path of the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Project directory: $PROJECT_DIR"

# Make scripts executable
chmod +x "$PROJECT_DIR/bin/acf"
chmod +x "$PROJECT_DIR/bin/agentic-control-framework-mcp"
chmod +x "$PROJECT_DIR/bin/agentic-control-framework-mcp"

# Create configuration files with proper paths
cat > "$PROJECT_DIR/mcp-connection.json" << EOL
{
  "agentic-control-framework": {
    "command": "$PROJECT_DIR/bin/agentic-control-framework-mcp",
    "protocol": "MCP"
  }
}
EOL

cat > "$PROJECT_DIR/settings.json" << EOL
{
  "agentic-control-framework": {
    "mcp": "$PROJECT_DIR/bin/agentic-control-framework-mcp",
    "apiKey": "GEMINI_API_KEY",
    "workspace": "$PROJECT_DIR"
  }
}
EOL

# Create .env file if it doesn't exist
if [ ! -f "$PROJECT_DIR/.env" ]; then
  cat > "$PROJECT_DIR/.env" << EOL
# Add your Gemini API key here for AI features
GEMINI_API_KEY=your_api_key_here
EOL
  echo "Created .env file. Please edit it to add your Gemini API key."
fi

# Add to shell profile if requested
add_to_path() {
  PROFILE_FILE="$1"
  if [ -f "$PROFILE_FILE" ]; then
    if ! grep -q "export ACF_PATH=" "$PROFILE_FILE"; then
      echo "" >> "$PROFILE_FILE"
      echo "# Agentic Control Framework" >> "$PROFILE_FILE"
      echo "export ACF_PATH=\"$PROJECT_DIR\"" >> "$PROFILE_FILE"
      echo "export PATH=\"\$PATH:$PROJECT_DIR/bin\"" >> "$PROFILE_FILE"
      echo "Added ACF_PATH and updated PATH in $PROFILE_FILE"
    else
      echo "ACF_PATH already exists in $PROFILE_FILE"
    fi
  fi
}

echo ""
echo "Setup complete! Configuration files created."
echo ""
echo "To use with Cursor IDE:"
echo "1. Open Cursor settings"
echo "2. Go to Extensions > MCP > Add connection"
echo "3. Add a new connection with these details:"
echo "   - Name: Agentic Control Framework"
echo "   - Command: $PROJECT_DIR/bin/agentic-control-framework-mcp"
echo "   - Extension ID: agentic-control-framework"
echo ""
echo "Do you want to add ACF_PATH and bin directory to your shell profile? (y/n)"
read -r ADD_TO_PROFILE

if [[ "$ADD_TO_PROFILE" == "y" || "$ADD_TO_PROFILE" == "Y" ]]; then
  # Detect shell and add to appropriate profile
  SHELL_NAME=$(basename "$SHELL")
  case "$SHELL_NAME" in
    bash)
      add_to_path "$HOME/.bashrc"
      [ -f "$HOME/.bash_profile" ] && add_to_path "$HOME/.bash_profile"
      ;;
    zsh)
      add_to_path "$HOME/.zshrc"
      ;;
    *)
      echo "Unknown shell: $SHELL_NAME"
      echo "Please manually add these lines to your shell profile:"
      echo "export ACF_PATH=\"$PROJECT_DIR\""
      echo "export PATH=\"\$PATH:$PROJECT_DIR/bin\""
      ;;
  esac
  
  echo ""
  echo "Please restart your terminal or run the following command:"
  echo "source ~/.${SHELL_NAME}rc"
fi

echo ""
echo "Installation complete! You can now use the Agentic Control Framework." 