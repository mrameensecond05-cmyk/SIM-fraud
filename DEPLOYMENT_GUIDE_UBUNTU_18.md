# Deploying SIM-Fraud System on Ubuntu 18.04

This guide is specifically tailored for **Ubuntu 18.04**, which has older system libraries. We have configured the project to work within these constraints.

## 1. Prerequisites (Ubuntu 18.04)

You need Docker and Git. Run these commands to install them:

```bash
# Update local repository
sudo apt-get update

# Install Git and Docker
sudo apt-get install -y git docker.io

# Start Docker and enable it on boot
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to the docker group (so you don't need 'sudo' for docker commands)
sudo usermod -aG docker $USER
```
*> **Note**: You must **logout and log back in** after running the `usermod` command for it to take effect.*

### Install Docker Compose
Ubuntu 18.04 repositories often have a very old version of docker-compose. Install a compatible standalone version:

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 2. Clone the Repository

```bash
git clone <YOUR_REPO_URL>
cd SIM-fraud
```

## 3. Deployment

We have created a single script that handles network configuration and startup.

### Option A: One-Command Start (Recommended)

This script automates:
1.  Detecting your machine's IP address.
2.  Updating the API configuration to use that IP.
3.  Building the Android APK and Docker containers.

```bash
# Make sure the script is executable
chmod +x run.sh

# Run the deployment script
./run.sh
```

*> **What to expect**: The script will print the detected IP, update files, build the Docker containers (handling the `bcrypt` dependencies automatically), and start the services.*

### Option B: Manual Start

If you prefer to run steps manually:

1.  **Configure Network**:
    ```bash
    python3 update_network_ip.py
    ```
2.  **Start Services**:
    ```bash
    docker-compose up -d --build
    ```

## 4. Troubleshooting Ubuntu 18.04 Issues

### Issue: `bcrypt` or `node-gyp` errors
**Cause**: Ubuntu 18.04 has older C++ compilers.
**Fix**: We have updated the `Dockerfile` to automatically install `python3`, `make`, and `g++` inside the container. **Do not run `npm install` on your host machine** if you have issues; rely on Docker.

### Issue: `GLIBC_2.28 not found`
**Cause**: Node.js 18+ requires a newer glibc than Ubuntu 18.04 supports natively.
**Fix**: Our Docker containers use a base image (`node:18-buster-slim`) that includes the necessary libraries, isolating the application from your host OS's limitations. Always run via Docker.

### Issue: `docker-compose: command not found`
**Fix**: Ensure you installed the standalone binary in Step 1. If `docker-compose --version` fails, check your PATH or run sudo `/usr/local/bin/docker-compose up`.
