import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';

const EditProfile = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [dpFile, setDpFile] = useState(null);
    const [dpPreview, setDpPreview] = useState(user?.profilePicture || '');

    const [formData, setFormData] = useState({
        phone: user?.phone || '',
        hostel: user?.hostel || '',
        roomNumber: user?.roomNumber || '',
        branch: user?.branch || '',
        graduationYear: user?.graduationYear || '',
        rollNumber: user?.rollNumber || ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image must be less than 5MB' });
                return;
            }
            setDpFile(file);
            setDpPreview(URL.createObjectURL(file));
            setMessage({ type: '', text: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const submitData = new FormData();

            Object.keys(formData).forEach(key => {
                if (formData[key]) submitData.append(key, formData[key]);
            });

            if (dpFile) {
                submitData.append('profilePicture', dpFile);
            }

            const response = await apiClient.put('/users/profile', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            login(response.data.user);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            setTimeout(() => navigate('/dashboard'), 2000);

        } catch (error) {
            console.error("Profile update error:", error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Edit Profile</h2>

                {message.text && (
                    <div className={`p-4 rounded-lg mb-6 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="flex flex-col items-center mb-6">
                        <div className="relative w-32 h-32 mb-4">
                            <img
                                src={dpPreview || 'https://via.placeholder.com/150?text=No+DP'}
                                alt="Profile Preview"
                                className="w-full h-full object-cover rounded-full border-4 border-gray-200 shadow-sm"
                            />
                        </div>
                        <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition border border-blue-200">
                            Change Profile Picture
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="10-digit number" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                            <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 123456" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hostel Name</label>
                            <input type="text" name="hostel" value={formData.hostel} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Banganga" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                            <input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 101" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                            <input type="text" name="branch" value={formData.branch} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. CSE" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                            <input type="number" name="graduationYear" value={formData.graduationYear} onChange={handleChange} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 2026" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-900 text-white font-bold p-4 rounded-lg hover:bg-gray-800 transition disabled:opacity-50 mt-6"
                    >
                        {loading ? 'Updating Profile...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;