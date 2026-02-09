import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

let canonicalLink = document.querySelector("link[rel='canonical']");
if (!canonicalLink) {
  canonicalLink = document.createElement('link');
  canonicalLink.rel = 'canonical';      
  document.head.appendChild(canonicalLink);
}
canonicalLink.href = window.location.href;