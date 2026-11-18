import json

with open('scratch/step1_audit_data.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

print('Total files:', d['totalFiles'])
print('Total size MB:', round(d['totalBytes'] / (1024*1024), 2))

print('\n--- (a) UNREFERENCED ASSETS ---')
total_unref = 0
for u in d['unreferencedAssets']:
    sz_kb = round(u['size']/1024, 1)
    total_unref += u['size']
    print(f"{u['path']:<45} {sz_kb:>8} KB")
print(f"Total unreferenced: {round(total_unref / (1024*1024), 2)} MB ({len(d['unreferencedAssets'])} files)")

print('\n--- (b) EXACT DUPLICATES (Same Hash) ---')
for dupe in d['duplicateAssets']:
    sz_kb = round(dupe['size']/1024, 1)
    print(f"{dupe['file1']} == {dupe['file2']} ({sz_kb} KB)")

print('\n--- FORMAT DUPLICATES (Same Stem Name) ---')
for fd in d['formatDuplicates']:
    print(f"Stem: {fd['stem']}")
    for f in fd['files']:
        refs = fd['refs'].get(f.replace('\\', '/'), [])
        print(f"  {f} -> {refs if refs else 'UNREFERENCED'}")

print('\n--- (d) UNUSED CSS VARS ---')
print(d['unusedVars'])

print('\n--- UNUSED KEYFRAMES ---')
print(d['unusedKeyframes'])
