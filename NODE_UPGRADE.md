# Node.js Upgrade Guide

## Current Issue

Your project is currently running on **Node.js 18.20.8**, which is deprecated and will no longer be supported by Supabase in future versions. This causes the warning:

```
⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js
```

## Recommended Solution

Upgrade to **Node.js 20.18.0** or later (LTS version).

## Upgrade Methods

### Option 1: Using nvm (Node Version Manager) - Recommended

If you have nvm installed:

```bash
# Install Node.js 20 LTS
nvm install 20

# Use Node.js 20
nvm use 20

# Set as default
nvm alias default 20

# Verify the version
node --version
```

### Option 2: Using nvm (if not installed)

```bash
# Install nvm first
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart your terminal, then:
nvm install 20
nvm use 20
nvm alias default 20
```

### Option 3: Direct Download

Download and install Node.js 20 LTS from [nodejs.org](https://nodejs.org/)

### Option 4: Using Homebrew (macOS)

```bash
# Update Homebrew
brew update

# Install Node.js 20
brew install node@20

# Link it
brew link node@20 --force

# Verify
node --version
```

## After Upgrading

1. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Verify the upgrade:**
   ```bash
   node --version  # Should show v20.x.x
   npm --version   # Should show 9.x.x or later
   ```

3. **Test your application:**
   ```bash
   npm run dev
   ```

## Benefits of Node.js 20

- ✅ **LTS Support**: Long-term support until April 2026
- ✅ **Supabase Compatibility**: Full support for latest Supabase features
- ✅ **Performance**: Better performance and memory management
- ✅ **Security**: Latest security updates and patches
- ✅ **Modern Features**: Support for latest JavaScript features

## Troubleshooting

### If you get permission errors:
```bash
# Fix npm permissions
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

### If you need to switch back temporarily:
```bash
nvm use 18  # Only if you have nvm
```

### If you get module resolution errors:
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Verification

After upgrading, you should see:
- ✅ No more Supabase deprecation warnings
- ✅ `node --version` shows v20.x.x
- ✅ Your app runs without Node.js version errors
- ✅ All tests pass (if you run the testing suite)

## Next Steps

1. **Upgrade Node.js** using one of the methods above
2. **Reinstall dependencies** to ensure compatibility
3. **Test your application** to ensure everything works
4. **Run tests** to verify the testing setup works with the new Node.js version

## Support

If you encounter issues during the upgrade:
1. Check the [Node.js migration guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
2. Review the [Supabase Node.js compatibility](https://supabase.com/docs/reference/javascript/supported-browsers)
3. Check the [Next.js Node.js requirements](https://nextjs.org/docs/getting-started/installation)
