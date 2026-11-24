import { create } from "zustand"
import { getLinksPage, getAllUsedTags, LINKS_PAGE_SIZE } from "#lib/links"
import type { LinksPageCursor } from "#lib/links"
import type { LinkWithTags } from "#lib/types/link"

type LinksMode = "all" | "search" | "tag"

// Monotonic generation token: every reset path bumps it, readers snapshot
// it and ignore results if it changed (stale in-flight response).
let linksGeneration = 0

interface LinksStore {
  links:       LinkWithTags[]
  allTags:     string[]
  loading:     boolean
  mode:        LinksMode
  query:       string
  tag:         string | null
  cursor:      LinksPageCursor | null
  hasMore:     boolean
  loadingMore: boolean

  loadLinks:       () => Promise<void>
  refreshLinks:    () => Promise<void>
  searchLinks:     (query: string) => Promise<void>
  filterByTag:     (tag: string) => Promise<void>
  loadMore:        () => Promise<void>
  addLink:         (link: LinkWithTags) => void
  patchLinkInList: (id: string, patch: Partial<LinkWithTags>) => void
  removeLink:      (id: string) => void
  reloadTags:      () => Promise<void>
}

export const useLinksStore = create<LinksStore>((set, get) => ({
  links:       [],
  allTags:     [],
  loading:     true,
  mode:        "all",
  query:       "",
  tag:         null,
  cursor:      null,
  hasMore:     true,
  loadingMore: false,

  loadLinks: async () => {
    const gen = ++linksGeneration
    set({ loading: true, mode: "all", query: "", tag: null, cursor: null, hasMore: true })
    try {
      const [{ links, nextCursor }, allTags] = await Promise.all([
        getLinksPage({ limit: LINKS_PAGE_SIZE }),
        getAllUsedTags(),
      ])
      if (gen !== linksGeneration) return
      set({ links, allTags, cursor: nextCursor, hasMore: nextCursor !== null, loading: false })
    } catch (err) {
      if (gen !== linksGeneration) return
      console.error("Failed to load links:", err)
      set({ loading: false })
    }
  },

  refreshLinks: async () => {
    const gen = ++linksGeneration
    const { mode, query, tag } = get()
    try {
      const [page, allTags] = await Promise.all([
        mode === "search"
          ? getLinksPage({ limit: LINKS_PAGE_SIZE, query })
          : mode === "tag" && tag
            ? getLinksPage({ limit: LINKS_PAGE_SIZE, tag })
            : getLinksPage({ limit: LINKS_PAGE_SIZE }),
        getAllUsedTags(),
      ])
      if (gen !== linksGeneration) return
      set({ links: page.links, cursor: page.nextCursor, hasMore: page.nextCursor !== null, allTags, loading: false })
    } catch (err) {
      if (gen !== linksGeneration) return
      console.error("Failed to refresh links:", err)
      set({ loading: false })
    }
  },

  searchLinks: async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      await get().loadLinks()
      return
    }
    const gen = ++linksGeneration
    set({ mode: "search", query: trimmed, tag: null, cursor: null, hasMore: true })
    try {
      const page = await getLinksPage({ limit: LINKS_PAGE_SIZE, query: trimmed })
      // Guard against a stale response after the user typed something else.
      if (gen !== linksGeneration) return
      if (get().mode !== "search" || get().query !== trimmed) {
        if (gen === linksGeneration) set({ loading: false })
        return
      }
      set({ links: page.links, cursor: page.nextCursor, hasMore: page.nextCursor !== null, loading: false })
    } catch (err) {
      if (gen !== linksGeneration) return
      console.error("Failed to search links:", err)
      set({ loading: false })
    }
  },

  filterByTag: async (tag: string) => {
    const gen = ++linksGeneration
    set({ mode: "tag", tag, query: "", cursor: null, hasMore: true })
    try {
      const page = await getLinksPage({ limit: LINKS_PAGE_SIZE, tag })
      if (gen !== linksGeneration) return
      if (get().mode !== "tag" || get().tag !== tag) {
        if (gen === linksGeneration) set({ loading: false })
        return
      }
      set({ links: page.links, cursor: page.nextCursor, hasMore: page.nextCursor !== null, loading: false })
    } catch (err) {
      if (gen !== linksGeneration) return
      console.error("Failed to filter links by tag:", err)
      set({ loading: false })
    }
  },

  loadMore: async () => {
    const { mode, query, tag, cursor, hasMore, loadingMore } = get()
    if (!hasMore || loadingMore) return
    const gen = linksGeneration
    set({ loadingMore: true })
    try {
      const page = await getLinksPage({
        limit: LINKS_PAGE_SIZE,
        cursor,
        ...(mode === "search" ? { query } : {}),
        ...(mode === "tag" && tag ? { tag } : {}),
      })
      if (gen !== linksGeneration) {
        set({ loadingMore: false })
        return
      }
      // A reset raced us (mode/query/tag changed) — drop the stale page.
      if (get().mode !== mode || get().query !== query || get().tag !== tag) {
        set({ loadingMore: false })
        return
      }
      const seen = new Set(get().links.map(l => l.id))
      const fresh = page.links.filter(l => !seen.has(l.id))
      // Terminate on zero progress so a duplicate/overlapping page
      // cannot stall the list with hasMore stuck true.
      const madeProgress = fresh.length > 0
      set(s => ({
        links: [...s.links, ...fresh],
        cursor: page.nextCursor,
        hasMore: page.nextCursor !== null && madeProgress,
        loadingMore: false,
      }))
    } catch (err) {
      console.error("Failed to load more links:", err)
      set({ loadingMore: false })
    }
  },

  addLink:         (link)        => set(s => ({ links: [link, ...s.links] })),
  patchLinkInList: (id, patch)   => set(s => ({ links: s.links.map(l => l.id === id ? { ...l, ...patch } : l) })),
  removeLink:      (id)          => set(s => ({ links: s.links.filter(l => l.id !== id) })),
  reloadTags:      async ()      => {
    const allTags = await getAllUsedTags()
    set({ allTags })
  },
}))
