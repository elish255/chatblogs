/* eslint-disable */

// @ts-nocheck

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as JisajiliRouteImport } from './routes/jisajili'
import { Route as LipaRouteImport } from './routes/lipa'
import { Route as LoginRouteImport } from './routes/login'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const JisajiliRoute = JisajiliRouteImport.update({ id: '/jisajili', path: '/jisajili', getParentRoute: () => rootRouteImport } as any)
const LipaRoute = LipaRouteImport.update({ id: '/lipa', path: '/lipa', getParentRoute: () => rootRouteImport } as any)
const LoginRoute = LoginRouteImport.update({ id: '/login', path: '/login', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/jisajili': typeof JisajiliRoute
  '/lipa': typeof LipaRoute
  '/login': typeof LoginRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/jisajili': typeof JisajiliRoute
  '/lipa': typeof LipaRoute
  '/login': typeof LoginRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/jisajili': typeof JisajiliRoute
  '/lipa': typeof LipaRoute
  '/login': typeof LoginRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/jisajili' | '/lipa' | '/login'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/jisajili' | '/lipa' | '/login'
  id: '__root__' | '/' | '/jisajili' | '/lipa' | '/login'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  JisajiliRoute: typeof JisajiliRoute
  LipaRoute: typeof LipaRoute
  LoginRoute: typeof LoginRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/jisajili': { id: '/jisajili'; path: '/jisajili'; fullPath: '/jisajili'; preLoaderRoute: typeof JisajiliRouteImport; parentRoute: typeof rootRouteImport }
    '/lipa': { id: '/lipa'; path: '/lipa'; fullPath: '/lipa'; preLoaderRoute: typeof LipaRouteImport; parentRoute: typeof rootRouteImport }
    '/login': { id: '/login'; path: '/login'; fullPath: '/login'; preLoaderRoute: typeof LoginRouteImport; parentRoute: typeof rootRouteImport }
  }
}

const rootRouteChildren: RootRouteChildren = { IndexRoute, JisajiliRoute, LipaRoute, LoginRoute }
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register { ssr: true; router: Awaited<ReturnType<typeof getRouter>>; config: Awaited<ReturnType<typeof startInstance.getOptions>> }
}
