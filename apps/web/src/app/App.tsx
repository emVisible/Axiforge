import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams, useSearchParams } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "@/app/providers/UserContext";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import { LoadingSpinner } from "@/shared/components/ui";
import { isTauriEnvironment } from "@/shared/storage/tauriSqlBackend";

// 布局常驻（体积小、跨路由共享）
import StudioLayout from "@/features/studio/layouts/StudioLayout";
import PlayerLayout from "@/features/player/layouts/PlayerLayout";
import { DiscoverLayout, AccountLayout } from "@/shared/layouts/PublicLayout";

// 页面按路由懒加载（v1.3 工程：路由级 code-split，演出资产前先拆包）
const CreatorDashboardPage = lazy(() => import("@/features/studio/pages/CreatorDashboardPage"));
const ProjectListPage = lazy(() => import("@/features/studio/pages/ProjectListPage"));
const ProjectCreatePage = lazy(() => import("@/features/studio/pages/ProjectCreatePage"));
const ProjectEditorPage = lazy(() => import("@/features/studio/pages/editor/ProjectEditorPage"));

/**
 * 首屏落点按运行环境直接判定（ADR-024：桌面优先，云能力可选）。
 * 桌面若落在 /discover 或云端概览，断网首屏就是一个拉不到数据的空页——
 * 实测过：released .app 冷启动即红字。
 */
const IS_DESKTOP = isTauriEnvironment();
const APP_HOME = IS_DESKTOP ? "/studio/projects" : "/discover";
const STUDIO_INDEX = IS_DESKTOP ? "projects" : "dashboard";

function ProjectFlowLegacyRedirect() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  return <Navigate to={`/studio/projects/${id}${qs ? `?${qs}` : ""}`} replace />;
}
const ItemsPage = lazy(() => import("@/features/studio/pages/ItemsPage"));
const ItemDetailPage = lazy(() => import("@/features/studio/pages/ItemDetailPage"));
const SceneAssetsPage = lazy(() => import("@/features/studio/pages/SceneAssetsPage"));
const SceneAssetDetailPage = lazy(() => import("@/features/studio/pages/SceneAssetDetailPage"));
const PlayerPage = lazy(() => import("@/features/player/pages/PlayerPage"));
const DiscoverPage = lazy(() => import("@/features/discover/pages/DiscoverPage"));
const DiscoverProjectDetailPage = lazy(
  () => import("@/features/discover/pages/DiscoverProjectDetailPage"),
);
const DiscoverCharacterDetailPage = lazy(
  () => import("@/features/discover/pages/DiscoverCharacterDetailPage"),
);
const DiscoverItemDetailPage = lazy(
  () => import("@/features/discover/pages/DiscoverItemDetailPage"),
);
const DiscoverSceneDetailPage = lazy(
  () => import("@/features/discover/pages/DiscoverSceneDetailPage"),
);
const DiscoverTopicPage = lazy(
  () => import("@/features/discover/pages/DiscoverTopicPage"),
);
const AuthorPage = lazy(() => import("@/features/discover/pages/AuthorPage"));
const ProfilePage = lazy(() => import("@/features/profile/pages/ProfilePage"));

const MyCharactersPage = lazy(() => import("@/features/character/pages/MyCharactersPage"));
const CreateCharacterPage = lazy(() => import("@/features/character/pages/CreateCharacterPage"));
const CharacterDetailPage = lazy(() => import("@/features/character/pages/CharacterDetailPage"));
const EditCharacterPage = lazy(() => import("@/features/character/pages/EditCharacterPage"));
const StoryReadPage = lazy(() => import("@/features/character/pages/StoryReadPage"));
const StoryEditPage = lazy(() => import("@/features/character/pages/StoryEditPage"));
const DocsLayout = lazy(() => import("@/features/docs/layouts/DocsLayout"));
const DocsIndexPage = lazy(() => import("@/features/docs/pages/DocsIndexPage"));
const DocArticlePage = lazy(() => import("@/features/docs/pages/DocArticlePage"));

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
      <ThemeProvider>
      <UserProvider>
        <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/studio" element={<StudioLayout />}>
              <Route index element={<Navigate to={STUDIO_INDEX} replace />} />
              <Route path="dashboard" element={<CreatorDashboardPage />} />
              <Route path="projects" element={<ProjectListPage />} />
              <Route path="projects/new" element={<ProjectCreatePage />} />
              <Route path="projects/:id" element={<ProjectEditorPage />} />
              <Route path="projects/:id/flow" element={<ProjectFlowLegacyRedirect />} />
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
              <Route path="/discover/characters/:id" element={<DiscoverCharacterDetailPage />} />
              <Route path="/discover/items/:id" element={<DiscoverItemDetailPage />} />
              <Route path="/discover/scenes/:id" element={<DiscoverSceneDetailPage />} />
              <Route path="/discover/topics/:slug" element={<DiscoverTopicPage />} />
              <Route path="/author/:authorId" element={<AuthorPage />} />
            </Route>

            <Route element={<AccountLayout />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route element={<DocsLayout />}>
              <Route path="/docs" element={<DocsIndexPage />} />
              <Route path="/docs/*" element={<DocArticlePage />} />
            </Route>

            <Route path="/" element={<Navigate to={APP_HOME} replace />} />
            <Route path="*" element={<Navigate to={APP_HOME} replace />} />
          </Routes>
        </Suspense>
        </BrowserRouter>
      </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
