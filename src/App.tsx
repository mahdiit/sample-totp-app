import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { IonApp, setupIonicReact } from '@ionic/react';
import AuthenticatorListPage from './pages/AuthenticatorListPage';
import ScannerPage from './pages/ScannerPage';
import LoginPage from './pages/LoginPage';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utilities */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

setupIonicReact();

const App: React.FC = () => {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <IonApp>
      {unlocked ? (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthenticatorListPage />} />
            <Route path="/scanner" element={<ScannerPage />} />
            <Route path="*" element={<AuthenticatorListPage />} />
          </Routes>
        </BrowserRouter>
      ) : (
        <LoginPage onUnlock={() => setUnlocked(true)} />
      )}
    </IonApp>
  );
};

export default App;
