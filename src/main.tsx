import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import '@fontsource-variable/inter';
import './index.css'

import AppLayout from './ui/AppLayout'
import Home from './ui/Home'
import Editor from './ui/Editor'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'quotes/:id', element: <Editor /> },
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster richColors position="top-right" />
  </React.StrictMode>
)