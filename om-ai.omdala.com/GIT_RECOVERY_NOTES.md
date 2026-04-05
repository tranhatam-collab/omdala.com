# Git Recovery Notes

Use this guide when local git reports pack/object errors (for example: `pack file is far too short`).

## 1. Quick Diagnosis

```bash
git fsck --full
git status
```

If `git fsck` reports broken pack/object files, continue below.

## 2. Backup Current Working Copy

```bash
mkdir -p ../ai-om-backup
cp -R . ../ai-om-backup/repo-copy-$(date +%Y%m%d-%H%M%S)
```

## 3. Clean Corrupted Pack Files (Local Only)

```bash
rm -f .git/objects/pack/*.idx
rm -f .git/objects/pack/*.pack
```

Then fetch objects again:

```bash
git fetch --all --prune
git fsck --full
```

## 4. If Corruption Persists: Re-clone Safely

```bash
cd ..
mv ai.omdala.com ai.omdala.com.corrupt.$(date +%Y%m%d-%H%M%S)
git clone <your-remote-url> ai.omdala.com
```

Copy only needed working changes from backup into fresh clone.

## 5. Verify Before Push/Tag

```bash
git fsck --full
npm run ci
```

Do not tag or push releases until fsck is clean.

## 6. Notes

- Avoid force-reset operations while object database is unstable.
- Prefer fresh clone over risky low-level git object edits.
