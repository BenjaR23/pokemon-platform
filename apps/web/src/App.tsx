import { Route, Routes } from "react-router-dom";
import { PokedexPage } from "./pages/PokedexPage";
import { PokemonDetailPage } from "./pages/PokemonDetailPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PokedexPage />}/>
      <Route path="/pokemon/:id" element={<PokemonDetailPage />} />
    </Routes>
  )
}

export default App;