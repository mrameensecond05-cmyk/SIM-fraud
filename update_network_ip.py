
import socket
import re
import os
import sys
import subprocess
import platform

def get_local_ip():
    """Detects the current local LAN IP address."""
    try:
        # Use a dummy connection to a public DNS to find the local interface IP used for routing
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        print(f"Error detecting IP: {e}")
        return None

def update_file(filepath, new_ip):
    """Updates the IP address in the specified file using regex."""
    if not os.path.exists(filepath):
        print(f"⚠️  Skipping {filepath} (file not found)")
        return False

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        updated_content = content
        changes = 0

        # Regex patterns for different files
        if filepath.endswith("userService.ts"):
            # Target: export const SERVER_IP = 'http://X.X.X.X:5000';
            pattern = r"(export\s+const\s+SERVER_IP\s*=\s*['\"]http://)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
            
            def replacer(match):
                return f"{match.group(1)}{new_ip}"
            
            updated_content, n = re.subn(pattern, replacer, content)
            changes += n

        elif filepath.endswith("network_security_config.xml"):
            # Target: <domain includeSubdomains="true">X.X.X.X</domain>
            pattern = r"(<domain\s+includeSubdomains=['\"]true['\"]>)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(</domain>)"
            
            def replacer(match):
                if match.group(2) == '127.0.0.1' or match.group(2) == 'localhost':
                    return match.group(0) # Keep localhost
                return f"{match.group(1)}{new_ip}{match.group(3)}"
            
            updated_content, n = re.subn(pattern, replacer, content)
            changes += n

        elif filepath.endswith("qa_test_suite.js") or filepath.endswith("test_sim_swap.js"):
            # Target: const BASE_URL = 'http://X.X.X.X...';
            pattern = r"(const\s+BASE_URL\s*=\s*['\"]http://)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
            
            def replacer(match):
                 return f"{match.group(1)}{new_ip}"

            updated_content, n = re.subn(pattern, replacer, content)
            changes += n

        elif filepath.endswith("verify_system.js"):
             # Target: const SERVER_IP = process.env.DB_HOST || 'X.X.X.X';
             pattern = r"(const\s+SERVER_IP\s*=\s*process\.env\.DB_HOST\s*\|\|\s*['\"])(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(['\"])"
             
             def replacer(match):
                 return f"{match.group(1)}{new_ip}{match.group(3)}"
             
             updated_content, n = re.subn(pattern, replacer, content)
             changes += n

        elif filepath.endswith("vite.config.ts"):
             # Target: target: 'http://X.X.X.X:5000',
             pattern = r"(target:\s*['\"]http://)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
             
             def replacer(match):
                 return f"{match.group(1)}{new_ip}"
             
             updated_content, n = re.subn(pattern, replacer, content)
             changes += n

        if updated_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"✅ Updated {filepath} (replaced {changes} instance(s) with {new_ip})")
            return True
        else:
            # Check if IP is already correct
            if new_ip in content:
                 print(f"ℹ️  {filepath} is already up to date with IP {new_ip}.")
            else:
                 print(f"ℹ️  No matching pattern found in {filepath}.")
            return False

    except Exception as e:
        print(f"❌ Failed to update {filepath}: {e}")
        return False

def run_command(command, cwd=None):
    """Runs a shell command and prints output."""
    print(f"🚀 Running: {command} in {cwd or os.getcwd()}")
    try:
        if platform.system() == "Windows":
             # Use shell=True for Windows commands
             subprocess.check_call(command, shell=True, cwd=cwd)
        else:
             subprocess.check_call(command, shell=True, cwd=cwd)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {e}")
        return False

def main():
    print("🔄 Network Auto-Configuration Tool")
    
    new_ip = get_local_ip()
    if not new_ip:
        print("❌ Could not determine local IP. Exiting.")
        sys.exit(1)

    print(f"📍 Detected Local IP: {new_ip}")
    
    # List of files to check (relative to project root)
    files_to_check = [
        "services/userService.ts",
        "vite.config.ts",
        "server/qa_test_suite.js",
        "android/app/src/main/res/xml/network_security_config.xml",
        "server/verify_system.js",
        "server/test_sim_swap.js"
    ]

    base_dir = os.getcwd()
    print(f"📂 Scanning files in: {base_dir}")

    any_updates = False
    for rel_path in files_to_check:
        full_path = os.path.join(base_dir, rel_path)
        if update_file(full_path, new_ip):
            any_updates = True

    print("\n✅ Configuration update complete.")
    
    if any_updates:
        print("⚠️  Changes detected. Starting Android build process...")
        
        # 1. Build Frontend (React)
        print("\n🔨 Building Frontend (Vite)...")
        if not run_command("npm run build", cwd=base_dir):
             print("❌ Frontend build failed. Aborting.")
             sys.exit(1)

        # 2. Sync Capacitor
        print("\n🔄 Syncing Capacitor...")
        if not run_command("npx cap sync", cwd=base_dir):
             print("❌ Capacitor sync failed. Aborting.")
             sys.exit(1)

        # 3. Build Android APK
        print("\n🤖 Building Android APK...")
        android_dir = os.path.join(base_dir, "android")
        
        if platform.system() == "Windows":
            gradle_cmd = "gradlew.bat assembleDebug"
        else:
            gradle_cmd = "./gradlew assembleDebug"
            # Ensure gradlew is executable on Linux/Mac
            run_command("chmod +x gradlew", cwd=android_dir)

        if run_command(gradle_cmd, cwd=android_dir):
            print("\n✅ Android APK built successfully!")
            apk_path = os.path.join(android_dir, "app/build/outputs/apk/debug/app-debug.apk")
            if os.path.exists(apk_path):
                print(f"📦 APK Location: {apk_path}")
                
                # Optional: Copy to server public folder for easy download
                public_dir = os.path.join(base_dir, "server/public")
                if not os.path.exists(public_dir):
                    os.makedirs(public_dir)
                import shutil
                dest_apk = os.path.join(public_dir, "simtinel.apk")
                shutil.copy2(apk_path, dest_apk)
                print(f"🚀 Deployed to server: {dest_apk}")
            else:
                 print("⚠️ APK build succeeded but file not found.")
        else:
            print("❌ Android build failed.")
            sys.exit(1)

    else:
        print("✅ No changes needed. Skipping rebuild.")
        sys.exit(0)

if __name__ == "__main__":
    main()
