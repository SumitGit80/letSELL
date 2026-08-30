import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';

const STATUS_STYLES = {
  Active: 'bg-green-100 text-green-700',
  Sold: 'bg-blue-100 text-blue-700',
  Inactive: 'bg-gray-100 text-gray-500'
};

const Dashboard = () => {
  const { user } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(null);

  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        const response = await apiClient.get('/users/my-listings');
        setMyListings(response.data.listings);
      } catch (error) {
        console.error("Error fetching listings", error);
      } finally {
        setLoadingListings(false);
      }
    };

    if (user) fetchMyListings();
  }, [user]);

  const handleStatusChange = async (listingId, newStatus) => {
    setStatusUpdating(listingId);
    try {
      const response = await apiClient.patch(`/listings/${listingId}/status`, {
        status: newStatus
      });
      setMyListings((prev) =>
        prev.map((item) =>
          item._id === listingId ? { ...item, status: response.data.listing.status } : item
        )
      );
    } catch (error) {
      console.error("Failed to update listing status:", error);
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to permanently delete this listing? This cannot be undone.")) return;
    
    setStatusUpdating(listingId);
    try {
      await apiClient.delete(`/listings/${listingId}`);
      setMyListings(prev => prev.filter(item => item._id !== listingId));
    } catch (error) {
      console.error("Failed to delete listing:", error);
      alert("Failed to delete listing.");
      setStatusUpdating(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0 justify-center">
          <Link to="/edit-profile" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition">
            Edit Profile
          </Link>
          <Link to="/change-password" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
            Change Password
          </Link>
          <Link to="/create-listing" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
            + Post New Ad
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 flex items-center space-x-6">
        {user ? (
          <img
            src={user.profilePicture || 'https://via.placeholder.com/100'}
            alt="Profile"
            className="w-24 h-24 rounded-full border-2 border-gray-200 object-cover"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse"></div>
        )}
        <div>
          <p className="text-2xl font-bold text-gray-800">{user?.name}</p>
          <p className="text-gray-500">{user?.email}</p>
          <div className="flex gap-4 mt-2 text-sm text-gray-600 flex-wrap">
            <span><strong>Roll:</strong> {user?.rollNumber || 'N/A'}</span>
            <span><strong>Hostel:</strong> {user?.hostel || 'N/A'} - {user?.roomNumber || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2 text-gray-800">My Uploaded Ads</h2>

        {loadingListings ? (
          <p className="text-gray-500 animate-pulse">Loading your items...</p>
        ) : myListings.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">You haven't posted any ads yet.</p>
            <Link to="/create-listing" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium inline-block hover:bg-blue-700">
              Post Your First Ad
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myListings.map(item => (
              <div key={item._id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition flex flex-col relative group">
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <Link
                    to={`/edit-listing/${item._id}`}
                    className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-700 shadow-md transition"
                    title="Edit Listing"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDeleteListing(item._id)}
                    disabled={statusUpdating === item._id}
                    className="bg-red-600 text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-700 shadow-md transition disabled:opacity-50"
                    title="Delete Listing"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
                <img
                  src={item.images?.[0] || 'https://via.placeholder.com/400x300'}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg text-gray-800 truncate pr-8">{item.title}</h3>
                  <p className="text-blue-600 font-bold text-xl my-1">₹{item.price}</p>

                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-700'}`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                      {item.category?.name || 'Category'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                    {item.status !== 'Active' && (
                      <button
                        onClick={() => handleStatusChange(item._id, 'Active')}
                        disabled={statusUpdating === item._id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition disabled:opacity-50"
                      >
                        Mark Active
                      </button>
                    )}
                    {item.status !== 'Sold' && (
                      <button
                        onClick={() => handleStatusChange(item._id, 'Sold')}
                        disabled={statusUpdating === item._id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition disabled:opacity-50"
                      >
                        Mark Sold
                      </button>
                    )}
                    {item.status !== 'Inactive' && (
                      <button
                        onClick={() => handleStatusChange(item._id, 'Inactive')}
                        disabled={statusUpdating === item._id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 font-semibold hover:bg-gray-100 transition disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;