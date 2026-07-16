import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User } from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const handleOAuthLogin = async (provider, profile, done) => {
    try {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const idKey = provider === 'google' ? 'googleId' : 'githubId';

        // 1. Check if user exists by OAuth ID
        let user = await User.findOne({ [idKey]: profile.id });
        if (user) {
            return done(null, user);
        }

        // 2. If not, check if user exists by Email (they might have registered manually)
        if (email) {
            user = await User.findOne({ email });
            if (user) {
                // Link the OAuth account to the existing email account
                user[idKey] = profile.id;
                await user.save({ validateBeforeSave: false });
                return done(null, user);
            }
        }

        // 3. If completely new user, create them!
        const fullName = profile.displayName || profile.username || 'OAuth User';
        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : '';
        
        // We use a dummy email if github doesn't provide one
        const userEmail = email || `${profile.username}@github.dummy.com`;

        const newUser = await User.create({
            fullName,
            email: userEmail,
            authProvider: provider,
            [idKey]: profile.id,
            avatar,
            isEmailVerified: true // OAuth providers already verify emails
        });

        return done(null, newUser);
    } catch (error) {
        return done(error, null);
    }
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/v1/users/auth/google/callback",
    scope: ['profile', 'email']
}, (accessToken, refreshToken, profile, done) => handleOAuthLogin('google', profile, done)));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/v1/users/auth/github/callback",
    scope: ['user:email']
}, (accessToken, refreshToken, profile, done) => handleOAuthLogin('github', profile, done)));

export default passport;
