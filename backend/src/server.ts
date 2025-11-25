import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import logger from 'morgan';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import bookmarkRoutes from './routes/bookmarkRoutes';
import placesRoutes from './routes/placesRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.get('/', (_req: Request, res: Response) => {
    res.send('API is running...');
});

app.use('/auth', authRoutes);
app.use('/bookmarks', bookmarkRoutes);
app.use('/places', placesRoutes);
app.use('/users', userRoutes);

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error(req.method, req.originalUrl);
    console.error("req.query");
    console.error(req.query);
    console.error("=================");
    console.error("req.body");
    console.log(req.body);
    console.error("=================");
    console.error("err");
    console.error(err);

    const errorMessage = "Internal Server Error!";
    const statusCode = 500;

    res.status(statusCode).json({ message: errorMessage });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at ${PORT}`);
});
