import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ThemeProvider } from './ThemeProvider';
import { UpdateToast } from './UpdateToast';
import { ItemDrawer } from '../features/items/ItemDrawer';

export function Layout() {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
        <ItemDrawer />
        <UpdateToast />
      </div>
    </ThemeProvider>
  );
}
