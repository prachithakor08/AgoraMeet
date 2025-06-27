import logo from './logo.svg';
import './App.css';
import LandingPage from './pages/landing';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Authentication from './pages/authentication';
import { AuthProvider } from './context/AuthContext';
import VideoMeet from './pages/VideoMeet';
import HomeComponent from './pages/Home';
import History from './pages/History';

function App() {
  return (
    <>
    <Router>
      <AuthProvider>
      <Routes>
          <Route path="/" element = {<LandingPage/>}></Route>
          
          <Route path="/home" element={<HomeComponent/>}></Route>

          <Route path="/auth" element = {<Authentication/>}></Route>
          
          <Route path='/:url' element={<VideoMeet/>}/>

          <Route path='/history' element={<History/>}></Route>
      </Routes>
      </AuthProvider>
    </Router>
    </>
  );
}

export default App;
