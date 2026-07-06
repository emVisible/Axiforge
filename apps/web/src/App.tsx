import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import StudioLayout from "./apps/studio/layouts/StudioLayout";
import ProjectListPage from "./apps/studio/pages/ProjectListPage";
import ProjectCreatePage from "./apps/studio/pages/ProjectCreatePage";
import ProjectDetailPage from "./apps/studio/pages/ProjectDetailPage";
import ProjectFlowPage from "./apps/studio/pages/ProjectFlowPage";
import ItemsPage from "./apps/studio/pages/ItemsPage";
import ItemDetailPage from "./apps/studio/pages/ItemDetailPage";
import SceneAssetsPage from "./apps/studio/pages/SceneAssetsPage";
import SceneAssetDetailPage from "./apps/studio/pages/SceneAssetDetailPage";
import PlayerPage from "./apps/player/pages/PlayerPage";
import PlayerLayout from "./apps/player/layouts/PlayerLayout";

import HallPage from "./modules/character/pages/HallPage";
import CreateCharacterPage from "./modules/character/pages/CreateCharacterPage";
import MyCharactersPage from "./modules/character/pages/MyCharactersPage";
import CharacterDetailPage from "./modules/character/pages/CharacterDetailPage";
import EditCharacterPage from "./modules/character/pages/EditCharacterPage";
import StoryReadPage from "./modules/character/pages/StoryReadPage";
import StoryEditPage from "./modules/character/pages/StoryEditPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/studio" element={<StudioLayout />}>
            <Route index element={<Navigate to="projects" replace />} />
            <Route path="projects" element={<ProjectListPage />} />
            <Route path="projects/new" element={<ProjectCreatePage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="projects/:id/flow" element={<ProjectFlowPage />} />
            <Route path="items" element={<ItemsPage />} />
            <Route path="items/:id" element={<ItemDetailPage />} />
            <Route path="scenes" element={<SceneAssetsPage />} />
            <Route path="scenes/:id" element={<SceneAssetDetailPage />} />

            <Route path="characters" element={<HallPage />} />
            <Route path="characters/new" element={<CreateCharacterPage />} />
            <Route path="characters/mine" element={<MyCharactersPage />} />
            <Route path="characters/:id" element={<CharacterDetailPage />} />
            <Route path="characters/:id/edit" element={<EditCharacterPage />} />
            <Route
              path="characters/:id/stories/:storyId"
              element={<StoryReadPage />}
            />
            <Route
              path="characters/:id/stories/:storyId/edit"
              element={<StoryEditPage />}
            />
          </Route>

          <Route path="/play/:projectId" element={<PlayerLayout />}>
            <Route index element={<PlayerPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/studio" replace />} />
          <Route path="*" element={<Navigate to="/studio" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
