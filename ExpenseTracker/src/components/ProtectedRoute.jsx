import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingWrapper } from './Loader';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (!user && !loading) {
    return <Navigate to="/login" replace />;
  }

  return (
    <LoadingWrapper isLoading={loading} message="Loading Expense Tracker..." minHeight="min-h-screen">
      <Outlet />
    </LoadingWrapper>
  );
};

export const PublicOnlyRoute = () => {
  const { user, loading } = useAuth();

  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <LoadingWrapper isLoading={loading} message="Loading..." minHeight="min-h-screen">
      <Outlet />
    </LoadingWrapper>
  );
};
