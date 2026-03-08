#!/bin/sh

# 1. Update package list and install required dependencies
# The Bun install script requires unzip to extract the binary, and bash to execute it.
apk update
apk add --no-cache curl unzip bash

# 2. Download and execute the official Bun installation script
curl -fsSL https://bun.sh/install | bash

# 3. Add Bun to your current session's PATH
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# 4. Verify the installation
bun --version