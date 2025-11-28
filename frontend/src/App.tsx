import { UserProvider } from './context/UserContext';
import { AppRouter } from './router/AppRouter';

export default function App() {
  return (
    <UserProvider>
      <AppRouter />
    </UserProvider>
  );
}
