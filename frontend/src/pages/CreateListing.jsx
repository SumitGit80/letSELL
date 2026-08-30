import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';

const CreateListing = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'Used - Good'
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/categories');
        setCategories(response.data.categories || response.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (images.length + selectedFiles.length > 5) {
      setError('You can only upload a maximum of 5 images.');
      return;
    }

    setImages((prev) => [...prev, ...selectedFiles]);

    const previews = selectedFiles.map(file => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
    setError('');
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
    setImagePreviews(imagePreviews.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (images.length === 0) {
      setError("Please select at least one image for your product.");
      setLoading(false);
      return;
    }

    if (!formData.category) {
      setError("Please select a category.");
      setLoading(false);
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('category', formData.category);
      submitData.append('condition', formData.condition);

      images.forEach((image) => {
        submitData.append('images', image);
      });

      await apiClient.post('/listings/create', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Sell an Item</h2>

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
                placeholder="e.g. iPhone 13 Pro - Mint Condition"
                value={formData.title} onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number" name="price" required min="1"
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 45000"
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
              placeholder="Include details like usage time, battery health, accessories included..."
              value={formData.description} onChange={handleChange}
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Photos (Max 5) *
            </label>

            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG (Max 5MB per image)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={images.length >= 5}
                />
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="flex gap-4 mt-4 overflow-x-auto py-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative flex-shrink-0">
                    <img src={preview} alt={`preview ${index}`} className="h-24 w-24 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600 shadow-md"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold p-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 mt-4"
          >
            {loading ? 'Uploading & Creating Listing...' : 'Post Ad Now'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;