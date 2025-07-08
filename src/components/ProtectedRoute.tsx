import { useAuth } from '@/context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Skeleton } from './ui/skeleton';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-8 md:p-12">
        <div className="flex justify-between items-center mb-8">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-[60vh] w-full rounded-lg" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;