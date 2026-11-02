import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installStaticServerlessFallback } from './lib/staticServerlessFallback.ts';

installStaticServerlessFallback();

createRoot(document.getElementById('root')!).render(<App />);
