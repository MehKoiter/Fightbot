# 📄 Documentation Template

Use this template when creating new documentation files to ensure consistency.

## File Naming Convention

- Use descriptive, uppercase names: `FEATURE-NAME.md`
- Include category prefix if needed: `API-REFERENCE.md`, `USER-GUIDE.md`
- Use hyphens for multi-word names: `CONFIGURATION-GUIDE.md`

## Document Structure Template

```markdown
# 🎯 [Document Title]

Brief description of what this document covers.

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)
- [See Also](#see-also)

## Section 1

Content for section 1...

### Subsection

More detailed content...

## Section 2

Content for section 2...

## Code Examples

When including code:

```javascript
// Always include comments
const example = 'Use syntax highlighting';
```

## Best Practices

- Use clear, descriptive headers
- Include code examples where relevant
- Cross-reference related documentation
- Keep content up-to-date with code changes

## See Also

- [Related Document 1](../category/DOCUMENT.md) - Description
- [Related Document 2](../category/DOCUMENT.md) - Description
```

## Documentation Categories

Choose the appropriate category for your document:

### 📁 user/
- User guides and tutorials
- End-user troubleshooting
- Feature explanations

### 📁 developer/
- API documentation
- Code examples
- Development workflows
- Testing guides

### 📁 deployment/
- Deployment instructions
- Environment setup
- Production configurations

### 📁 configuration/
- Configuration options
- Environment variables
- Setup procedures

### 📁 architecture/
- System design
- Technical architecture
- Design patterns

### 📁 maintenance/
- Operational procedures
- Monitoring guides
- Regular maintenance tasks

### 📁 features/
- Specific feature documentation
- Phase-based development docs
- Feature specifications

### 📁 templates/
- Reusable documentation templates
- Standards and guidelines
- Documentation tools

## Writing Guidelines

### Style
- Use clear, concise language
- Write in active voice
- Use consistent terminology
- Include examples where helpful

### Formatting
- Use proper Markdown syntax
- Include emoji in headers for visual appeal
- Use code blocks for commands and code
- Use tables for structured data

### Cross-References
- Link to related documentation
- Use relative paths: `../category/DOCUMENT.md`
- Include "See Also" sections
- Reference external resources when needed

### Version Control
- Follow the [Documentation Workflow](../developer/DOCUMENTATION-WORKFLOW.md)
- Update the main [docs README](../README.md) if adding new categories
- Use descriptive commit messages
- Test all links and code examples

## Quality Checklist

Before submitting documentation:

- [ ] Clear, descriptive title
- [ ] Proper category placement
- [ ] Table of contents (for longer docs)
- [ ] Code examples tested
- [ ] All links work
- [ ] Cross-references included
- [ ] Spelling and grammar checked
- [ ] Follows template structure
- [ ] Updated relevant index files

## Examples

### Good Documentation
- Clear purpose statement
- Logical organization
- Working code examples
- Helpful cross-references
- Regular updates

### Poor Documentation
- Unclear purpose
- Missing examples
- Broken links
- Outdated information
- No cross-references

## Maintenance

Documentation should be:
- **Reviewed regularly** for accuracy
- **Updated** when code changes
- **Tested** for working examples
- **Linked** from appropriate places
- **Archived** if no longer relevant

## See Also

- [Documentation Workflow](../developer/DOCUMENTATION-WORKFLOW.md) - How to contribute
- [Change Template](CHANGE_TEMPLATE.md) - Template for documenting changes
- [docs README](../README.md) - Main documentation index
