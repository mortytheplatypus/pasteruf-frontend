import './App.css';
import PasteForm from './components/PasteForm';
import Content from './components/Content';

const SHORTLINK_LENGTH = 8; // 7 1 leading '/' + 7 characters

function App() {
  const pathname = window.location.pathname || '/';
  const shortlink = pathname.startsWith('/') && pathname.length === SHORTLINK_LENGTH ? pathname.slice(1) : null;

  return (
    <div className="App">
      <h1>Pasteruf</h1>
      {shortlink ? <Content shortlink={shortlink} /> : <PasteForm />}
    </div>
  );
}

export default App;
