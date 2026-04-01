import os

# Folder structure
structure = {
    "backend/app/api": ["moon.py", "mission.py", "health.py"],
    "backend/app/core": ["config.py", "time_utils.py"],
    "backend/app/services": ["moon_service.py", "mission_service.py"],
    "backend/app/models": ["moon.py", "mission.py"],
    "backend/app/utils": ["direction.py", "math_utils.py"],
    "backend/app": ["main.py"],
    "backend": ["requirements.txt", "Dockerfile", ".env.example"],

    "mobile/lib/screens": ["home_screen.dart"],
    "mobile/lib/services": ["api_service.dart"],
    "mobile/lib/models": ["moon_model.dart"],
    "mobile/lib": ["main.dart"],
    "mobile": ["pubspec.yaml", "README.md"],

    "web/pages": ["index.js"],
    "web/components": ["MoonCard.js"],
    "web": ["package.json"],

    "data": ["artemis2.json", "sample_locations.json"],
    "docs": ["architecture.md", "api.md", "getting-started.md"],
    "examples": ["track_moon.py"],

    ".github": ["ISSUE_TEMPLATE.md", "PULL_REQUEST_TEMPLATE.md"],

    "": ["docker-compose.yml", "README.md", "CONTRIBUTING.md", "LICENSE"]
}

def create_structure(base_path="."):
    for folder, files in structure.items():
        folder_path = os.path.join(base_path, folder)

        # Create directory
        if folder:
            os.makedirs(folder_path, exist_ok=True)

        # Create files
        for file in files:
            file_path = os.path.join(folder_path, file)
            if not os.path.exists(file_path):
                with open(file_path, "w") as f:
                    f.write("")  # empty file

    print("✅ LUNA project structure created successfully!")

if __name__ == "__main__":
    create_structure()