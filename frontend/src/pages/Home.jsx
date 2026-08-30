import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';

const Home = () => {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchDefaultListings();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/categories');
      setCategories(res.data.categories);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const fetchDefaultListings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/listings');
      setListings(res.data.listings);
      setError('');
    } catch (err) {
      console.error("Failed to load listings", err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim() && !selectedCategory) {
      setSelectedCategory('');
      fetchDefaultListings();
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.get('/listings/search', {
        params: {
          q: searchQuery,
          category: selectedCategory
        }
      });
      setListings(res.data.listings);
      setError('');
    } catch (err) {
      console.error("Search failed", err);
      setError('Failed to fetch search results.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-blue-600 text-white py-12 px-4 shadow-md">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Buy & Sell within <span className="text-yellow-300">NIT Campus</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8 font-medium">
            Find electronics, cycles, books, and hostel essentials easily.
          </p>

          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row bg-white p-2 rounded-lg shadow-lg gap-2"
          >
            <input
              type="text"
              placeholder="What are you looking for? (e.g., Laptop, Cycle)"
              className="flex-grow p-3 text-gray-800 outline-none rounded-md focus:bg-blue-50 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              className="p-3 text-gray-700 bg-gray-50 border-l md:border-l border-gray-200 outline-none cursor-pointer focus:bg-blue-50 transition"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-md hover:bg-yellow-500 transition-colors shadow-sm"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 border-b pb-4">
          {searchQuery || selectedCategory ? 'Search Results' : 'Fresh Recommendations'}
        </h2>

        {loading ? (
          <div className="flex justify-center items-center h-48">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 bg-red-50 p-4 rounded-lg font-medium">{error}</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-100 shadow-sm">
            <p className="text-xl text-gray-500 font-medium">No items found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                fetchDefaultListings();
              }}
              className="mt-4 text-blue-600 hover:underline font-bold"
            >
              Clear filters and view all items
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((item) => (
              <Link
                to={`/listing/${item._id}`}
                key={item._id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                  <img
                    src={item.images[0] || 'https://via.placeholder.com/300?text=No+Image'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.condition && (
                    <span className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs font-bold px-2 py-1 rounded">
                      {item.condition}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-lg truncate mb-1">{item.title}</h3>
                  <p className="text-2xl font-extrabold text-blue-600 mb-3">₹{item.price}</p>

                  <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                    <span className="flex items-center gap-1">
                      🏷️ {item.category?.name || 'General'}
                    </span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;