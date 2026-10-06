import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {MascotProvider} from './components/PlannerMascot';
import './styles.css';
import './reference-theme.css';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><MascotProvider><App/></MascotProvider></React.StrictMode>);
