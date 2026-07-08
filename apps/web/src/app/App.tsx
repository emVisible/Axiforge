import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "@/app/providers/UserContext";
import { LoadingSpinner } from "@/shared/components/ui";

// 布局常驻（体积小、跨路由共享）
import StudioLayout from "@/features/studio/layouts/StudioLayout";
import PlayerLayout from "@/features/player/layouts/PlayerLayout";
import { DiscoverLayout, AccountLayout } from "@/shared/layouts/PublicLayout";

// 页面按路由懒加载（v1.3 工程：路由级 code-split，演出资产前先拆包）
const CreatorDashboardPage = lazy(() => import("@/features/studio/pages/CreatorDashboardPage"));
const ProjectListPage = lazy(() => import("@/features/studio/pages/ProjectListPage"));
const ProjectCreatePage = lazy(() => import("@/features/studio/pages/ProjectCreatePage"));
const ProjectDetailPage = lazy(() => import("@/features/studio/pages/ProjectDetailPage"));
const ProjectFlowPage = lazy(() => import("@/features/studio/pages/ProjectFlowPage"));
const ItemsPage = lazy(() => import("@/features/studio/pages/ItemsPage"));
const ItemDetailPage = lazy(() => import("@/features/studio/pages/ItemDetailPage"));
const SceneAssetsPage = lazy(() => import("@/features/studio/pages/SceneAssetsPage"));
const SceneAssetDetailPage = lazy(() => import("@/features/studio/pages/SceneAssetDetailPage"));
const PlayerPage = lazy(() => import("@/features/player/pages/PlayerPage"));
const DiscoverPage = lazy(() => import("@/features/discover/pages/DiscoverPage"));
const DiscoverProjectDetailPage = lazy(
  () => import("@/features/discover/pages/DiscoverProjectDetailPage"),
);
const AuthorPage = lazy(() => import("@/features/discover/pages/AuthorPage"));
const ProfilePage = lazy(() => import("@/features/profile/pages/ProfilePage"));

const MyCharactersPage = lazy(() => import("@/features/character/pages/MyCharactersPage"));
const CreateCharacterPage = lazy(() => import("@/features/character/pages/CreateCharacterPage"));
const CharacterDetailPage = lazy(() => import("@/features/character/pages/CharacterDetailPage"));
const EditCharacterPage = lazy(() => import("@/features/character/pages/EditCharacterPage"));
const StoryReadPage = lazy(() => import("@/features/character/pages/StoryReadPage"));
const StoryEditPage = lazy(() => import("@/features/character/pages/StoryEditPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/studio" element={<StudioLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CreatorDashboardPage />} />
              <Route path="projects" element={<ProjectListPage />} />
              <Route path="projects/new" element={<ProjectCreatePage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="projects/:id/flow" element={<ProjectFlowPage />} />
              <Route path="items" element={<ItemsPage />} />
              <Route path="items/:id" element={<ItemDetailPage />} />
              <Route path="scenes" element={<SceneAssetsPage />} />
              <Route path="scenes/:id" element={<SceneAssetDetailPage />} />

              <Route path="characters" element={<Navigate to="mine" replace />} />
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

            <Route element={<DiscoverLayout />}>
              <Route path="/discover" element={<DiscoverPage />} />
              <Route path="/discover/projects/:id" element={<DiscoverProjectDetailPage />} />
              <Route path="/author/:authorId" element={<AuthorPage />} />
            </Route>

            <Route element={<AccountLayout />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route path="/" element={<Navigate to="/discover" replace />} />
            <Route path="*" element={<Navigate to="/discover" replace />} />
          </Routes>
        </Suspense>
        </BrowserRouter>
      </UserProvider>
    </QueryClientProvider>
  );
}
