import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="vh-100 d-flex align-items-center justify-content-center">
      <EmptyState icon="bi-compass" title="Page not found" action={<Link to="/" className="btn btn-primary">Back to jobs</Link>}>
        The page you are looking for does not exist or has moved.
      </EmptyState>
    </div>
  );
}
