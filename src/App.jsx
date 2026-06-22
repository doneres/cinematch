import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import CreateSession from './pages/CreateSession'
import JoinSession from './pages/JoinSession'
import Lobby from './pages/Lobby'
import Swipe from './pages/Swipe'
import Match from './pages/Match'
import FilmManager from './pages/FilmManager'
import WatchSession from './pages/WatchSession'
import Review from './pages/Review'

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateSession />} />
          <Route path="/join" element={<JoinSession />} />
          <Route path="/join/:code" element={<JoinSession />} />
          <Route path="/lobby/:code" element={<Lobby />} />
          <Route path="/swipe/:code" element={<Swipe />} />
          <Route path="/match/:code" element={<Match />} />
          <Route path="/watch/:code" element={<WatchSession />} />
          <Route path="/review/:code" element={<Review />} />
          <Route path="/films" element={<FilmManager />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
