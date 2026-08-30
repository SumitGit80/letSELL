import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
        <Link to="/" className="text-2xl font-bold tracking-wider hover:opacity-90 transition">
          letSELL<span className="text-yellow-300"> NIT AP</span>
        </Link>

        <div className="flex gap-5 items-center">
          <Link to="/" className="hover:text-yellow-300 transition font-medium">
            Home
          </Link>

          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-yellow-300 transition font-medium">
                Dashboard
              </Link>

              <div className="hidden md:flex items-center gap-4 border-l border-blue-400 pl-5 ml-1">
                <span className="font-medium text-blue-100">
                  Hi, {user.name.split(' ')[0]}
                </span>

                <Link
                  to="/create-listing"
                  className="bg-yellow-400 text-gray-900 px-5 py-2 rounded-full font-extrabold shadow-md hover:bg-yellow-500 hover:scale-105 transition-all border-[3px] border-yellow-300"
                >
                  + SELL
                </Link>

                <button
                  onClick={handleLogout}
                  className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition font-semibold shadow-sm"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4 border-l border-blue-400 pl-5 ml-1">
                <Link to="/login" className="hover:text-yellow-300 transition font-medium">
                  Login
                </Link>
                <Link to="/register" className="bg-white text-blue-600 px-5 py-2 rounded-lg hover:bg-gray-100 transition font-semibold shadow">
                  Sign Up
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;