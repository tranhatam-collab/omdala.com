# Branch Protection Checklist

Use this checklist when configuring branch protections for `main`.

## Required Settings

- [ ] Require pull request before merging
- [ ] Require approvals (minimum 1-2)
- [ ] Dismiss stale approvals on new commits
- [ ] Require status checks to pass
- [ ] Require branch to be up to date before merge
- [ ] Require conversation resolution before merge
- [ ] Restrict force pushes
- [ ] Restrict branch deletion

## Recommended Required Checks

- [ ] CI workflow (`.github/workflows/ci.yml`)
- [ ] Optional smoke check workflow (if added later)

## Review Rules

- [ ] CODEOWNERS required review is enabled
- [ ] Sensitive folders (`backend/`, `gateway/`) require owning team review

## Security and Operations

- [ ] Secret scanning enabled
- [ ] Dependency alerts enabled
- [ ] Dependabot updates configured

## Release Safety

- [ ] Release checklist (`RELEASE_CHECKLIST.md`) referenced in release PR
- [ ] Changelog (`CHANGELOG.md`) updated before merge to release tag
