import axios from 'axios';
import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { auth as firebaseAuth } from '../config/firebaseAdmin';
import User from '../models/User';
import { loginSchema, signupSchema } from '../validations/authValidation';

interface AuthRequest extends Request {
    user?: any;
}

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = signupSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ errors: validation.error.issues });
            return;
        }

        const { username, email, password } = validation.data;

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ errors: validation.error.issues });
            return;
        }

        const { username, password } = validation.data;

        const user = await User.findOne({ username });
        if (!user) {
            res.status(400).json({ message: 'invalid username or password' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'invalid username or password' });
            return;
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '1h',
        });

        res.json({ token, user: { id: user._id, username: user.username, email: user.email, createdAt: user.createdAt } });
    } catch (error) {
        next(error);
    }
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            res.status(400).json({ message: 'Access token is required' });
            return;
        }

        // Verify the Google access token
        const googleResponse = await axios.get(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
        );

        const googleUser = googleResponse.data;

        if (!googleUser.email) {
            res.status(400).json({ message: 'Invalid Google token' });
            return;
        }

        // Check if user exists
        let user = await User.findOne({ email: googleUser.email });

        if (!user) {
            // Create new user with Google data
            user = new User({
                username: googleUser.name || googleUser.email.split('@')[0],
                email: googleUser.email,
                password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for Google users
                profilePicture: googleUser.picture,
            });

            await user.save();
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '1h',
        });

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt
            }
        });
    } catch (error: any) {
        console.error('Google auth error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            res.status(401).json({ message: 'Invalid or expired Google token' });
            return;
        }
        next(error);
    }
};

export const firebaseAuthHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('🔄 Firebase auth request received');
        const { idToken } = req.body;

        if (!idToken) {
            console.error('❌ No ID token provided in request');
            res.status(400).json({ message: 'ID token is required' });
            return;
        }

        console.log('✅ ID token received, verifying...');

        // Check if Firebase is configured
        if (!firebaseAuth) {
            console.error('❌ Firebase Admin SDK not configured');
            res.status(503).json({
                message: 'Firebase authentication is not configured on the server',
                hint: 'Please contact the administrator to configure Firebase credentials'
            });
            return;
        }

        // Verify the Firebase ID token
        const decodedToken = await firebaseAuth.verifyIdToken(idToken);
        console.log('✅ Token verified successfully for:', decodedToken.email);

        const { email, name, picture, uid } = decodedToken;

        if (!email) {
            console.error('❌ No email in decoded token');
            res.status(400).json({ message: 'Invalid Firebase token' });
            return;
        }

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
            console.log('📝 Creating new user for:', email);
            // Create new user with Firebase data
            user = new User({
                username: name || email.split('@')[0],
                email: email,
                password: await bcrypt.hash(uid, 10), // Use Firebase UID as password
                profilePicture: picture,
            });

            await user.save();
            console.log('✅ New user created:', user.username);
        } else {
            console.log('✅ Existing user found:', user.username);
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '1h',
        });

        console.log('✅ JWT token generated successfully');
        console.log('✅ Authentication complete for:', user.email);

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt
            }
        });
    } catch (error: any) {
        console.error('❌ Firebase auth error:', error);
        if (error.code === 'auth/id-token-expired') {
            console.error('⚠️ Token expired');
            res.status(401).json({ message: 'Firebase token expired' });
            return;
        }
        if (error.code === 'auth/argument-error') {
            console.error('⚠️ Invalid token format');
            res.status(400).json({ message: 'Invalid Firebase token format' });
            return;
        }
        next(error);
    }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: 'Please provide current and new password' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid current password' });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};
