import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => jest.fn(),
    defaults: {
      withCredentials: false,
    },
  },
}));

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }) => <pre>{children}</pre>,
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
}));

test('renders QnA portal home page', () => {
  render(
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  );

  expect(screen.getByText(/QnA Portal/i)).toBeInTheDocument();
  expect(screen.getByText(/Explore Questions/i)).toBeInTheDocument();
});
