import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const response = await apiClient.patch(`/listings/${id}/status`, {
        status: newStatus
      });
      setListing({ ...listing, status: response.data.listing.status });
    } catch (error) {
      console.error("Failed to update listing status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this listing? This cannot be undone.")) return;
    
    setStatusUpdating(true);
    try {
      await apiClient.delete(`/listings/${id}`);
      navigate('/dashboard');
    } catch (error) {
      console.error("Failed to delete listing:", error);
      alert("Failed to delete listing.");
      setStatusUpdating(false);
    }
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await apiClient.get(`/listings/${id}`);
        setListing(response.data.listing);

        if (response.data.listing.images && response.data.listing.images.length > 0) {
          setActiveImage(response.data.listing.images[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Listing fetch error:", err);
        setError('Failed to load listing details. It might have been deleted or sold.');
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold mb-2">Oops!</h2>
          <p>{error || 'Listing not found.'}</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 font-semibold hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/" className="text-blue-600 font-medium hover:underline mb-6 inline-block">
        &larr; Back to Listings
      </Link>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">

          <div className="flex flex-col gap-4">
            <div className="h-96 w-full bg-gray-100 rounded-lg overflow-hidden border">
              <img
                src={activeImage || 'https://via.placeholder.com/600?text=No+Image'}
                alt={listing.title}
                className="w-full h-full object-contain"
              />
            </div>

            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {listing.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(img)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${activeImage === img ? 'border-blue-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-6 border-b pb-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
                  {listing.title}
                </h1>
              </div>
              <p className="text-4xl font-bold text-blue-600">₹{listing.price}</p>
            </div>

            <div className="flex gap-3 mb-6">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${
                listing.status === 'Active' ? 'bg-green-100 text-green-700' :
                listing.status === 'Sold' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {listing.status === 'Active' ? '🟢 Active' :
                 listing.status === 'Sold' ? '🔵 Sold' : '⚪ Inactive'}
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                🏷️ {listing.category?.name || 'General'}
              </span>
              {listing.condition && (
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  ✨ {listing.condition}
                </span>
              )}
            </div>

            <div className="mb-8 flex-grow">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            </div>

            {user && listing.seller?._id === user._id ? (
              <div className="mt-auto bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4">Manage Your Listing</h3>
                
                <div className="flex flex-wrap gap-3">
                  {listing.status !== 'Active' && (
                    <button
                      onClick={() => handleStatusChange('Active')}
                      disabled={statusUpdating}
                      className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg font-bold hover:bg-green-600 transition shadow-sm disabled:opacity-50"
                    >
                      Mark Active
                    </button>
                  )}
                  {listing.status !== 'Sold' && (
                    <button
                      onClick={() => handleStatusChange('Sold')}
                      disabled={statusUpdating}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                    >
                      Mark Sold
                    </button>
                  )}
                  {listing.status !== 'Inactive' && (
                    <button
                      onClick={() => handleStatusChange('Inactive')}
                      disabled={statusUpdating}
                      className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-gray-700 transition shadow-sm disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
                  <Link
                    to={`/edit-listing/${id}`}
                    className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-lg font-bold hover:bg-blue-200 transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                    Edit Ad
                  </Link>

                  <button
                    onClick={handleDeleteListing}
                    disabled={statusUpdating}
                    className="w-full bg-red-100 text-red-600 py-2 px-4 rounded-lg font-bold hover:bg-red-200 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    Permanently Delete
                  </button>
                </div>

              </div>
            ) : (
              <div className="mt-auto bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Seller Information</h3>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
                  <img
                    src={listing.seller?.profilePicture || 'https://via.placeholder.com/150?text=No+DP'}
                    alt="Seller"
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                  />

                  <div className="flex-1 w-full">
                    <p className="text-xl font-bold text-gray-900 mb-3">{listing.seller?.name}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-700">
                      <p className="flex items-center gap-2">
                        🏢 <span className="font-semibold text-gray-900">Hostel:</span> {listing.seller?.hostel || 'N/A'}
                      </p>
                      <p className="flex items-center gap-2">
                        📞 <span className="font-semibold text-gray-900">Phone:</span> {listing.seller?.phone || 'Hidden'}
                      </p>
                      <p className="flex items-center gap-2" title={listing.seller?.email}>
                        ✉️ <span className="font-semibold text-gray-900">Email:</span> {listing.seller?.email || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200">
                  {listing.seller?.phone ? (
                    <a
                      href={`tel:${listing.seller.phone}`}
                      className="flex justify-center items-center gap-2 bg-green-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-green-600 transition shadow-md"
                    >
                      📞 Call Seller
                    </a>
                  ) : (
                    <button disabled className="bg-gray-200 text-gray-500 py-3 px-4 rounded-lg font-bold cursor-not-allowed">
                      🚫 Phone Hidden
                    </button>
                  )}

                  <a
                    href={`mailto:${listing.seller?.email}?subject=Interested in your listing: ${listing.title}`}
                    className="flex justify-center items-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-blue-700 transition shadow-md"
                  >
                    ✉️ Email Seller
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;