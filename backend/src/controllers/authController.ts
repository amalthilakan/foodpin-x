import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
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
