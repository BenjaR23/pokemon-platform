import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { PokedexPage } from "./pages/PokedexPage";
import { PokemonDetailPage } from "./pages/PokemonDetailPage";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<PokedexPage />}/>
        <Route path="/pokemon/:id" element={<PokemonDetailPage />} />
        <Route
          path="pokemon/:id/variants/:variantId"
          element={<PokemonDetailPage />}
        />
      </Route>
    </Routes>
  )
}

export default App;