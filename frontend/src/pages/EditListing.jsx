import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import apiClient from '../api/axios';

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  
  // Existing images (URLs fetched from backend)
  const [existingImages, setExistingImages] = useState([]);
  
  // New images to upload (File objects)
  const [newImages, setNewImages] = useState([]);
  // Previews for new images
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'Used - Good'
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [catRes, listingRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get(`/listings/${id}`)
        ]);

        setCategories(catRes.data.categories || catRes.data);
        
        const listing = listingRes.data.listing;
        setFormData({
          title: listing.title,
          description: listing.description,
          price: listing.price,
          category: listing.category._id || listing.category,
          condition: listing.condition || 'Used - Good'
        });
        
        setExistingImages(listing.images || []);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError("Failed to load listing details. It may not exist or you might not be the owner.");
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (existingImages.length + newImages.length + selectedFiles.length > 5) {
      setError('You can only have a maximum of 5 images total.');
      return;
    }

    setNewImages((prev) => [...prev, ...selectedFiles]);

    const previews = selectedFiles.map(file => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...previews]);
    setError('');
  };

  const removeExistingImage = (indexToRemove) => {
    setExistingImages(existingImages.filter((_, index) => index !== indexToRemove));
  };

  const removeNewImage = (indexToRemove) => {
    setNewImages(newImages.filter((_, index) => index !== indexToRemove));
    setNewImagePreviews(newImagePreviews.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (existingImages.length === 0 && newImages.length === 0) {
      setError("Please have at least one image for your product.");
      setSaving(false);
      return;
    }

    if (!formData.category) {
      setError("Please select a category.");
      setSaving(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('category', formData.category);
      submitData.append('condition', formData.condition);
      
      // Send retained images as JSON array
      submitData.append('retainedImages', JSON.stringify(existingImages));

      newImages.forEach((image) => {
        submitData.append('images', image);
      });

      await apiClient.put(`/listings/${id}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update listing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/dashboard" className="text-blue-600 font-medium hover:underline mb-6 inline-block">
        &larr; Back to Dashboard
      </Link>
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Edit Ad</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Title *</label>
              <input
                type="text" name="title" required maxLength="100"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.title} onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number" name="price" required min="1"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.price} onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                name="category" required
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.category} onChange={handleChange}
              >
                <option value="" disabled>Select a Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
              <select
                name="condition" required
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={formData.condition} onChange={handleChange}
              >
                <option value="New">New</option>
                <option value="Used - Like New">Used - Like New</option>
                <option value="Used - Good">Used - Good</option>
                <option value="Used - Fair">Used - Fair</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description" required rows="4"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.description} onChange={handleChange}
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manage Photos (Max 5 Total) *
            </label>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 font-semibold mb-2 uppercase">Currently Uploaded</p>
                <div className="flex gap-4 overflow-x-auto py-2">
                  {existingImages.map((img, index) => (
                    <div key={`exist-${index}`} className="relative flex-shrink-0">
                      <img src={img} alt={`existing ${index}`} className="h-24 w-24 object-cover rounded-lg border border-blue-300" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600 shadow-md"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images UI */}
            {existingImages.length + newImages.length < 5 && (
              <div className="flex items-center justify-center w-full mt-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload new images</span></p>
                    <p className="text-xs text-gray-500">You can add {5 - (existingImages.length + newImages.length)} more</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            )}

            {/* Previews for New Images */}
            {newImagePreviews.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 font-semibold mb-2 uppercase">New Additions</p>
                <div className="flex gap-4 overflow-x-auto py-2">
                  {newImagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative flex-shrink-0">
                      <img src={preview} alt={`preview ${index}`} className="h-24 w-24 object-cover rounded-lg border border-green-300" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600 shadow-md"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white font-bold p-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 mt-4"
          >
            {saving ? 'Updating Ad...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditListing;
