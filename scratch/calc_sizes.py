import os

project_root = os.path.abspath('.')

all_files = {}
for root, dirs, files in os.walk(project_root):
    if 'scratch' in root or '.git' in root:
        continue
    for f in files:
        p = os.path.relpath(os.path.join(root, f), project_root)
        full_p = os.path.join(project_root, p)
        all_files[p] = os.path.getsize(full_p)

total_size_bytes = sum(all_files.values())

unref_files = [
    'assets\\ground.png',
    'assets\\hero-bg.png',
    'assets\\leaf-pair.png',
    'assets\\logo-clean.png',
    'assets\\logo-lockup.png',
    'assets\\logo-tree.png',
    'assets\\top-branch.png',
    'assets\\images\\heartfelt-stories.webp'
]

unref_size_bytes = sum(all_files[p] for p in unref_files)

print(f"Total current project files: {len(all_files)}")
print(f"Total current project size: {total_size_bytes} bytes ({round(total_size_bytes/(1024*1024), 2)} MB)")
print(f"Unreferenced assets to move: {len(unref_files)} files")
print(f"Unreferenced assets size: {unref_size_bytes} bytes ({round(unref_size_bytes/(1024*1024), 2)} MB)")
print(f"Projected size after moving unreferenced assets: {total_size_bytes - unref_size_bytes} bytes ({round((total_size_bytes - unref_size_bytes)/(1024*1024), 2)} MB)")
