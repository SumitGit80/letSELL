// src/controllers/authController.js
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_TTL = '15m';

const signupSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string()
        .email('Invalid email format')
        .regex(/^\d{6}@student\.nitandhra\.ac\.in$/, 'Email must start with a 6-digit roll number and end with @student.nitandhra.ac.in'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
    email: z.string()
        .email('Invalid email format')
        .regex(/^\d{6}@student\.nitandhra\.ac\.in$/, 'Email must start with a 6-digit roll number and end with @student.nitandhra.ac.in')
});

const resetPasswordSchema = z.object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
    resetToken: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const hashOtp = (otp) =>
    crypto.createHmac('sha256', process.env.JWT_SECRET).update(otp).digest('hex');

const verifyOtpHash = (otp, otpHash) => {
    const submittedHash = hashOtp(otp.toString());
    const expectedBuffer = Buffer.from(otpHash, 'hex');
    const submittedBuffer = Buffer.from(submittedHash, 'hex');

    if (expectedBuffer.length !== submittedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, submittedBuffer);
};

const getCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE_MS
});

const setAuthCookie = (res, token) => {
    res.cookie('token', token, getCookieOptions());
};

const createSessionToken = (user) =>
    jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

const formatUserResponse = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
});

const getEmailTransporter = () =>
    nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

const validationErrorResponse = (res, parsedData) =>
    res.status(400).json({
        message: 'Invalid input data',
        errors: parsedData.error.issues
    });

/**
 * @desc    Step 1: Validate input, send OTP email, return short-lived registration token
 * @route   POST /api/auth/register-initiate
 */
export const initiateSignup = async (req, res) => {
    try {
        const parsedData = signupSchema.safeParse(req.body);
        if (!parsedData.success) {
            return validationErrorResponse(res, parsedData);
        }

        const { name, email, password } = parsedData.data;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        const otp = generateOtp();
        const transporter = getEmailTransporter();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OLX Clone Verification OTP',
            html: `<h3>Hello ${name},</h3>
                   <p>Your OTP for registration is: <strong>${otp}</strong></p>
                   <p>This OTP is valid for 15 minutes.</p>`
        });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const registrationToken = jwt.sign(
            { name, email, password: hashedPassword, otpHash: hashOtp(otp) },
            process.env.JWT_SECRET,
            { expiresIn: OTP_TTL }
        );

        res.status(200).json({
            message: 'OTP sent to your email successfully.',
            registrationToken
        });
    } catch (error) {
        console.error('Signup Initiation Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @desc    Step 2: Verify OTP, create user, and start an HttpOnly cookie session
 * @route   POST /api/auth/register-verify
 */
export const verifyOtp = async (req, res) => {
    try {
        const { otp, registrationToken } = req.body;

        if (!otp || !registrationToken) {
            return res.status(400).json({ message: 'OTP and registration token are required.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(registrationToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: 'Session expired or invalid token. Please sign up again.' });
        }

        const { name, email, password: hashedPassword, otpHash } = decoded;

        if (!otpHash || !verifyOtpHash(otp, otpHash)) {
            return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'User already registered.' });
        }

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });

        const token = createSessionToken(newUser);
        setAuthCookie(res, token);

        res.status(201).json({
            message: 'Account verified and created successfully!',
            user: formatUserResponse(newUser)
        });
    } catch (error) {
        console.error('OTP Verification Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @desc    Verify credentials and log user in with an HttpOnly cookie session
 * @route   POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const parsedData = loginSchema.safeParse(req.body);
        if (!parsedData.success) {
            return validationErrorResponse(res, parsedData);
        }

        const { email, password } = parsedData.data;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = createSessionToken(user);
        setAuthCookie(res, token);

        res.status(200).json({
            message: 'Successfully logged in!',
            user: formatUserResponse(user)
        });
    } catch (error) {
        console.error('Login Controller Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @desc    Clear the session cookie
 * @route   POST /api/auth/logout
 */
export const logout = async (req, res) => {
    try {
        res.clearCookie('token', getCookieOptions());

        res.status(200).json({
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout Controller Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @desc    Step 1: Send password-reset OTP if the account exists
 * @route   POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
    try {
        const parsedData = forgotPasswordSchema.safeParse(req.body);
        if (!parsedData.success) {
            return validationErrorResponse(res, parsedData);
        }

        const { email } = parsedData.data;
        const user = await User.findOne({ email });

        if (user) {
            const otp = generateOtp();
            const transporter = getEmailTransporter();

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset OTP',
                html: `<h3>Hello ${user.name},</h3>
                       <p>You requested a password reset. Your OTP is: <strong>${otp}</strong></p>
                       <p>This OTP is valid for 15 minutes. If you did not request this, please ignore this email.</p>`
            });

            const resetToken = jwt.sign(
                { email, otpHash: hashOtp(otp) },
                process.env.JWT_SECRET,
                { expiresIn: OTP_TTL }
            );

            return res.status(200).json({
                message: 'If an account exists for this email, an OTP has been sent.',
                resetToken
            });
        }

        res.status(200).json({
            message: 'If an account exists for this email, an OTP has been sent.'
        });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @desc    Step 2: Verify reset OTP and set a new password
 * @route   POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
    try {
        const parsedData = resetPasswordSchema.safeParse(req.body);
        if (!parsedData.success) {
            return validationErrorResponse(res, parsedData);
        }

        const { otp, resetToken, newPassword } = parsedData.data;

        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: 'Session expired or invalid token. Please request a new OTP.' });
        }

        const { email, otpHash } = decoded;

        if (!otpHash || !verifyOtpHash(otp, otpHash)) {
            return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({
            message: 'Password has been reset successfully. You can now log in with your new password.'
        });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * @desc    Change password for a logged-in user
 * @route   POST /api/auth/change-password
 */
export const changePassword = async (req, res) => {
    try {
        const parsedData = changePasswordSchema.safeParse(req.body);
        if (!parsedData.success) {
            return validationErrorResponse(res, parsedData);
        }

        const { oldPassword, newPassword } = parsedData.data;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Incorrect old password. Please try again.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({
            message: 'Password has been successfully changed!'
        });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
