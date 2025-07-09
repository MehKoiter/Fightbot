# 📝 Change Documentation Template

Use this template when making any changes to FightBot to ensure proper documentation.

## 📋 Pre-Change Checklist

### Change Information
- **Type**: [Bug Fix / New Feature / Enhancement / Deployment]
- **Description**: Brief description of what you're changing
- **Impact**: [Low / Medium / High]
- **Files Affected**: List of files that will be modified

### Documentation Plan
- [ ] Identify which documentation files need updates
- [ ] Plan what content needs to be added/modified
- [ ] Determine if version bump is needed

## 📚 Documentation Updates Required

### Always Update
- [ ] `CHANGELOG.md` - Add entry for this change
- [ ] Version numbers (if applicable)

### Update if Applicable
- [ ] `README.md` - For feature changes or user-facing fixes
- [ ] `DEPLOYMENT.md` - For deployment or configuration changes
- [ ] `COMMAND-DEPLOYMENT.md` - For command-related changes
- [ ] `PHASE7.md` - For fighter feature changes
- [ ] Feature-specific docs - Create new docs if needed

## 🔧 Implementation Workflow

### 1. Documentation First
```bash
git checkout -b [type]/[brief-description]
# Update documentation files first
git add *.md
git commit -m "📚 Document planned [type]: [brief-description]"
```

### 2. Implement Changes
```bash
# Make your code changes
# Test thoroughly
# Update any remaining documentation
```

### 3. Final Review
```bash
# Review all documentation for accuracy
npm run test:comprehensive  # Ensure everything works
git add .
git commit -m "🔧 [type]: [brief-description] with documentation"
```

### 4. Merge and Deploy
```bash
git checkout main
git merge [type]/[brief-description]
git push origin main  # Deploy with complete documentation
```

## ✅ Post-Change Verification

- [ ] All documentation is accurate and up-to-date
- [ ] Examples work as documented
- [ ] Version numbers are consistent
- [ ] No broken links or references
- [ ] Changes are properly described in CHANGELOG.md

## 📝 Template Usage Example

**Change**: Fix interaction timeout in `/fighter` command

**Documentation Updates**:
- [x] `CHANGELOG.md` - Add fix entry
- [x] `README.md` - Update recent fixes section
- [x] Add troubleshooting info
- [x] Version bump to 1.7.1-free

**Result**: Users have complete information about the fix and how it improves their experience.

---

**Remember**: Documentation is not an afterthought - it's an essential part of every change! 📚✨
