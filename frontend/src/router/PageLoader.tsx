import { Loading } from '../components/common/Loading';

export const PageLoader = ({ message = 'Cargando...' }: { message?: string }) => (
  <Loading
    fullPage
    message={message}
    className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100"
  />
);
