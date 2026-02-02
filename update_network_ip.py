
import socket
import re
import os

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
        return

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        updated_content = content
        changes = 0

        # Regex patterns for different files
        if filepath.endswith("userService.ts"):
            # Target: export const SERVER_IP = 'http://X.X.X.X:5000';
            # We assume port 5000 for development.
            # Look for the IP inside the SERVER_IP definition
            pattern = r"(export\s+const\s+SERVER_IP\s*=\s*['\"]http://)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
            
            def replacer(match):
                return f"{match.group(1)}{new_ip}"
            
            updated_content, n = re.subn(pattern, replacer, content)
            changes += n

        elif filepath.endswith("network_security_config.xml"):
            # Target: <domain includeSubdomains="true">X.X.X.X</domain>
            pattern = r"(<domain\s+includeSubdomains=['\"]true['\"]>)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(</domain>)"
            
            def replacer(match):
                # Don't replace localhost if it shows up here, but usually it's the LAN IP we want to change
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
             # Target 1: const SERVER_IP = process.env.DB_HOST || 'X.X.X.X';
             # Target 2: const BASE_URL = `http://${SERVER_IP}:5000/api`; (Usually just relies on variable, but we check for hardcoded fallback)
             
             pattern = r"(const\s+SERVER_IP\s*=\s*process\.env\.DB_HOST\s*\|\|\s*['\"])(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(['\"])"
             
             def replacer(match):
                 return f"{match.group(1)}{new_ip}{match.group(3)}"
             
             updated_content, n = re.subn(pattern, replacer, content)
             changes += n

        if changes > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(updated_content)
            print(f"✅ Updated {filepath} (replaced {changes} instance(s) with {new_ip})")
        else:
            print(f"ℹ️  No matching pattern found in {filepath} or IP already set.")

    except Exception as e:
        print(f"❌ Failed to update {filepath}: {e}")

def main():
    print("🔄 Network Auto-Configuration Tool")
    
    new_ip = get_local_ip()
    if not new_ip:
        print("❌ Could not determine local IP. Exiting.")
        return

    print(f"📍 Detected Local IP: {new_ip}")
    
    # List of files to check (relative to project root)
    files_to_check = [
        "services/userService.ts",
        "server/qa_test_suite.js",
        "android/app/src/main/res/xml/network_security_config.xml",
        "server/verify_system.js",
        "server/test_sim_swap.js"
    ]

    base_dir = os.getcwd()
    print(f"📂 Scanning files in: {base_dir}")

    for rel_path in files_to_check:
        full_path = os.path.join(base_dir, rel_path)
        update_file(full_path, new_ip)

    print("\n✅ Configuration update complete.")
    print("⚠️  Remember to rebuild your Android app if you updated the XML config:")
    print("   npx cap copy android")
    print("   npx cap open android")

if __name__ == "__main__":
    main()
