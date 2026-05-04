import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { router } from './app/routes';
import { useSW } from './state/sw';
import './index.css';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    useSW.setState({
      needRefresh: true,
      applyUpdate: () => {
        void updateSW(true);
      },
    });
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
