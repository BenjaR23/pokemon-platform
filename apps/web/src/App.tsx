import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { PokedexPage } from "./pages/PokedexPage";
import { PokemonDetailPage } from "./pages/PokemonDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
  )
}

export default App;