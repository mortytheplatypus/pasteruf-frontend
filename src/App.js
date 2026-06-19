import './App.css';
import PasteForm from './components/PasteForm';
import Content from './components/Content';
import BackendStatus from './components/BackendStatus';

const SHORTCODE_LENGTH = 8; // 1 leading '/' + 7 characters

function App() {
  const pathname = window.location.pathname || '/';
  const shortcode = pathname.startsWith('/') && pathname.length === SHORTCODE_LENGTH ? pathname.slice(1) : null;
  return (
    <div className="App">
      <h1>Pasteruf</h1>
      <BackendStatus />
      {shortcode ? <Content shortcode={shortcode} /> : <PasteForm />}
    </div>
  );
}

export default App;
