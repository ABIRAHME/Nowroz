# Nowroz Admin Panel - Authentication System

## Overview
This document explains the authentication system for the Nowroz Admin Panel, which has been updated to work with serverless deployments like Vercel.

## Key Features
- Firebase Authentication integration
- Persistent login using localStorage (instead of sessionStorage)
- Compatible with serverless environments
- Secure user management

## Setup Instructions

### 1. Initial Setup
Before using the admin panel in production, you need to set up the admin users in Firebase Authentication:

1. Deploy the application to your hosting environment (local or Vercel)
2. Navigate to the `/admin/setup.html` page
3. Click the "Initialize Admin Users" button to create the default admin accounts
4. Once setup is complete, you can log in using the admin credentials

### 2. Admin Credentials
The system comes with the following default admin users:

- Username: `ahmedabir` / Password: `Ahmedabir2025`
- Username: `hasibulhira` / Password: `Hasibulhira2025`
- Username: `muhammadsojib` / Password: `Muhammadsojib2025`
- Username: `cofounder` / Password: `Cofounder2025`

**Important:** For production use, you should change these default passwords after the initial setup.

## Deployment on Vercel

### Prerequisites
- A Vercel account
- Git repository with your Nowroz project

### Deployment Steps

1. **Push your code to a Git repository** (GitHub, GitLab, or Bitbucket)

2. **Connect your repository to Vercel**:
   - Log in to your Vercel account
   - Click "New Project"
   - Import your Git repository
   - Configure the project settings:
     - Build Command: Leave empty (static site)
     - Output Directory: Leave empty (root directory)
     - Environment Variables: Add any required environment variables

3. **Deploy the project**:
   - Click "Deploy"
   - Wait for the deployment to complete

4. **Set up Firebase Authentication**:
   - After deployment, navigate to your Vercel domain + `/admin/setup.html`
   - Complete the setup process as described above

## Authentication System Architecture

The authentication system uses the following components:

- `firebase-auth.js`: Main authentication logic using Firebase Authentication
- `config.js`: Firebase configuration
- `setup-firebase-users.js`: Script to initialize admin users

The system uses localStorage instead of sessionStorage to maintain login state across page refreshes and browser sessions, making it compatible with serverless environments like Vercel.

## Security Considerations

- The admin credentials are stored securely in Firebase Authentication
- For production use, consider enabling additional Firebase security features like:
  - Email verification
  - Password policies
  - Login attempt limits
- Regularly update admin passwords
- Consider implementing two-factor authentication for additional security

## Troubleshooting

### Login Issues
- Ensure Firebase is properly configured in `config.js`
- Check that the admin users were successfully created via the setup page
- Clear browser cache and localStorage if experiencing persistent issues

### Deployment Issues
- Verify that all Firebase SDK scripts are properly loaded
- Check browser console for any JavaScript errors
- Ensure your Firebase project has Authentication enabled in the Firebase Console