import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/axios';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [rollNumber, setRollNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const rollRegex = /^\d{6}$/;
    if (!rollRegex.test(rollNumber)) {
      setError("Please enter a valid 6-digit roll number.");
      setLoading(false);
      return;
    }

    const constructedEmail = `${rollNumber}@student.nitandhra.ac.in`;

    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email: constructedEmail
      });

      setResetToken(response.data.resetToken);
      setStep(2);
      setTimer(60);
      setSuccessMessage('OTP sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError('');
    setSuccessMessage('');

    const constructedEmail = `${rollNumber}@student.nitandhra.ac.in`;

    try {
      const response = await apiClient.post('/auth/forgot-password', {
        email: constructedEmail
      });

      setResetToken(response.data.resetToken);
      setTimer(60);
      setSuccessMessage('A new OTP has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await apiClient.post('/auth/reset-password', {
        otp,
        newPassword,
        resetToken
      });

      setSuccessMessage(response.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP or Session Expired');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ isVisible }) => (
    isVisible ? (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  );

  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Reset Password</h2>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        {successMessage && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">{successMessage}</div>}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
              <div className="flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden bg-white">
                <input
                  type="text"
                  required
                  maxLength="6"
                  placeholder="123456"
                  className="w-full p-3 outline-none"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.replace(/\D/g, ''))}
                />
                <span className="pr-3 py-3 text-gray-500 bg-gray-50 border-l border-gray-300 text-sm whitespace-nowrap">
                  @student.nitandhra.ac.in
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                We'll send a 6-digit OTP to your college email to verify your identity.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold p-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 mt-2"
            >
              {loading ? 'Sending OTP...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm text-center">
              OTP sent to <span className="font-semibold">{rollNumber}@student.nitandhra.ac.in</span>.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-Digit OTP</label>
              <input
                type="text"
                required
                maxLength="6"
                placeholder="000000"
                className="w-full border border-gray-300 p-3 rounded-lg text-center tracking-[0.5em] text-2xl focus:ring-2 focus:ring-green-500 outline-none"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength="6"
                  placeholder="••••••••"
                  className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <EyeIcon isVisible={showPassword} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-semibold p-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center mt-4">
              {timer > 0 ? (
                <p className="text-sm text-gray-500">
                  Resend OTP in <span className="font-semibold text-gray-700">{timer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="text-sm text-blue-600 hover:underline font-medium disabled:text-gray-400"
                >
                  {resendLoading ? 'Resending...' : 'Resend OTP'}
                </button>
              )}
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-blue-600 hover:underline font-medium flex justify-center items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;