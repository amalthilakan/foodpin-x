import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    user?: any;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
        return;
    }

    next();
};
