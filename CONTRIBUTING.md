# Contributing to Odisha Pizza Hub

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional. We have zero tolerance for harassment.

## Getting Started

### 1. Fork and Clone
```bash
git clone https://github.com/yourusername/odisha-pizza.git
cd odisha-pizza
```

### 2. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-name
```

### 3. Install Dependencies
```bash
npm run install:all
```

### 4. Make Changes
Ensure your code follows the existing style and patterns in the project.

## Coding Standards

### JavaScript Style
- Use ES6+ features
- Use const/let instead of var
- Arrow functions where appropriate
- Meaningful variable names
- Comments for complex logic

### File Organization
- Frontend components: `src/components/`
- Frontend pages: `src/pages/`
- Backend routes: `src/routes/`
- Backend controllers: `src/controllers/`
- Utilities: `src/utils/` or `utils/`

### Naming Conventions
- Components: PascalCase (e.g., `ProductCard.jsx`)
- Functions: camelCase (e.g., `calculateTotal`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- Files: Descriptive, lowercase with hyphens (e.g., `auth-service.js`)

## Commit Guidelines

### Commit Messages
Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Dev dependency updates

**Examples:**
```bash
git commit -m "feat(auth): add phone OTP login"
git commit -m "fix(orders): fix order status update issue"
git commit -m "docs(api): update API documentation"
```

## Making Changes

### Backend Changes
1. Update models if needed
2. Update controllers
3. Update routes
4. Add validation if needed
5. Update API documentation
6. Test with curl or Postman

### Frontend Changes
1. Create/update components
2. Update pages if needed
3. Update context if state changes needed
4. Add Framer Motion animations
5. Test functionality in browser

### Testing Your Changes

**Backend:**
```bash
npm run dev:backend

# Test API endpoints
curl -X GET http://localhost:5000/api/products
```

**Frontend:**
```bash
npm run dev:frontend

# Open http://localhost:5173 in browser
# Test features manually
```

## Pull Request Process

### Before Submitting
1. Update documentation if code changes functionality
2. Ensure code follows project style
3. Test thoroughly locally
4. Update `.md` files if needed

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring

## Testing Done
Describe testing performed

## Related Issues
Fixes #(issue)
```

### PR Requirements
- ✅ Descriptive title
- ✅ Clear description of changes
- ✅ Related issue linked
- ✅ Code follows style guide
- ✅ No console errors
- ✅ Updated docs if needed

## Feature Development Checklist

- [ ] Create feature branch
- [ ] Implement feature
- [ ] Add necessary validations
- [ ] Update API docs if needed
- [ ] Test thoroughly
- [ ] Create/update tests
- [ ] Submit PR with description
- [ ] Respond to review feedback
- [ ] Get approval and merge

## Bug Report Guidelines

### When Reporting Bugs
Include:
1. **Description**: Clear, concise description
2. **Steps to Reproduce**: Exact steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, Node version, browser, etc.
6. **Screenshots/Error Logs**: If applicable

### Example Bug Report
```
Title: Cart total incorrect with multiple coupons

Description:
When applying multiple coupons, the final total is calculated incorrectly.

Steps to Reproduce:
1. Add item to cart (₹300)
2. Apply coupon A (10% off)
3. Apply coupon B (5% off)
4. Total shows ₹270 but should be ₹256.50

Expected: ₹256.50
Actual: ₹270

Environment: Windows 10, Node 18, Chrome latest
```

## Feature Request Guidelines

### When Requesting Features
Include:
1. **Use Case**: Why is this needed?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other possible approaches
4. **Additional Context**: Any other info

### Example Feature Request
```
Title: Add order cancellation feature

Use Case:
Customers should be able to cancel orders if not yet prepared.

Proposed Solution:
- Add "Cancel Order" button on customer dashboard
- Only show if order status is "pending"
- Refund online payment immediately
- Store cancellation reason

Alternatives:
- Admin could cancel on behalf of customer
- Auto-cancel after timeout
```

## Areas for Contribution

### High Priority
- 🔴 Bug fixes
- 🔴 Security improvements
- 🔴 Performance optimization

### Medium Priority
- 🟡 Documentation improvements
- 🟡 Code refactoring
- 🟡 Test coverage

### Low Priority
- 🟢 UI/UX improvements
- 🟢 New features
- 🟢 Example code

## Review Process

### Code Review Criteria
1. **Functionality**: Does it work as intended?
2. **Code Quality**: Is it clean and maintainable?
3. **Tests**: Are there adequate tests?
4. **Documentation**: Is it documented?
5. **Security**: Are there security concerns?
6. **Performance**: Will it impact performance?

### Reviewer Feedback
- Be constructive and respectful
- Suggest improvements, don't demand
- Explain the "why" not just the "what"
- Acknowledge good work

## Development Setup

### Environment Variables
```bash
# Backend
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/odisha_pizza
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key
RAZORPAY_KEY_ID=test_key
RAZORPAY_KEY_SECRET=test_secret

# Frontend
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=test_key
```

### Running Backend
```bash
cd backend
npm install
npm run dev
```

### Running Frontend
```bash
cd frontend
npm install
npm run dev
```

## Common Issues

### Port Already in Use
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>
```

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string
- Verify IP whitelist (MongoDB Atlas)

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. Create GitHub Release with notes

## Getting Help

- 📖 **Documentation**: Check [docs/](docs/) folder
- 🐛 **Issues**: Search for existing issues
- 💬 **Discussions**: Start a discussion
- 📧 **Email**: Contact maintainers

## Acknowledgments

Thank you for contributing to Odisha Pizza Hub! Your efforts help make this project better for everyone.

---

*Last updated: February 2026*
