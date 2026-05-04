import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import HomePage from '../features/projects/HomePage';
import ProjectDetailPage from '../features/projects/ProjectDetailPage';
import InboxPage from '../features/inbox/InboxPage';
import ReportsPage from '../features/reports/ReportsPage';
import SettingsPage from '../features/settings/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'project/:id', element: <ProjectDetailPage /> },
      { path: 'inbox', element: <InboxPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
