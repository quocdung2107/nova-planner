import { useEffect, useRef, useState } from "react"
import { Search, Plus, Link2 } from "lucide-react"
import { useDebounce } from "use-debounce"
import { useVirtualizer } from "@tanstack/react-virtual"

import { Button } from "#components/ui/button"
import { Input } from "#components/ui/input"
import { Badge } from "#components/ui/badge"
import { Skeleton } from "#components/ui/skeleton"
import { cn } from "#lib/utils"
import { useLinksStore } from "#store/links"
import { LinkListItem } from "./link-list-item"
import { AddLinkDialog } from "./add-link-dialog"

export function LinkList() {
  const links       = useLinksStore(s => s.links)
  const allTags     = useLinksStore(s => s.allTags)
  const loading     = useLinksStore(s => s.loading)
  const hasMore     = useLinksStore(s => s.hasMore)
  const loadingMore = useLinksStore(s => s.loadingMore)
  const { loadLinks, refreshLinks, searchLinks, filterByTag } = useLinksStore.getState()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTag,  setActiveTag]  = useState<string | null>(null)
  const [search,     setSearch]     = useState("")
  const [debouncedSearch] = useDebounce(search, 300)

  const scrollRef   = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count:           links.length,
    getScrollElement: () => scrollRef.current,
    estimateSize:    () => 80,   // estimated row height in px
    overscan:        5,
  })

  // Single first-page load path lives in the search/filter effect below
  // (it runs on mount with empty search + null tag), so no separate
  // mount effect here — that would double-fetch on startup.

  useEffect(() => {
    const handler = () => {
      void refreshLinks().then(() => {
        try { virtualizer.scrollToIndex(0) } catch { /* empty list */ }
      })
    }
    window.addEventListener("personal-os:sync-complete", handler)
    return () => window.removeEventListener("personal-os:sync-complete", handler)
  }, [refreshLinks, virtualizer])

  // Search / filter — scroll back to top when results change.
  // This is the single first-page load path (mount + search + tag + all).
  useEffect(() => {
    // H2: handleTagClick clears `search` synchronously but debouncedSearch
    // lags ~300ms. Without this guard the stale non-empty value would hit
    // the search branch below and clear the just-applied tag.
    if (search.trim() === "" && debouncedSearch.trim() !== "") return
    try { virtualizer.scrollToIndex(0) } catch { /* empty list */ }
    if (debouncedSearch.trim()) {
      setActiveTag(null)
      void searchLinks(debouncedSearch.trim())
    } else if (activeTag) {
      void filterByTag(activeTag)
    } else {
      void loadLinks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, activeTag])

  // Infinite scroll — load the next cursor page when the sentinel appears
  useEffect(() => {
    const el = sentinelRef.current
    const root = scrollRef.current
    if (!el || !root || loading) return
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          const s = useLinksStore.getState()
          if (s.hasMore && !s.loadingMore) void s.loadMore()
        }
      },
      { root, rootMargin: "400px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loading, links.length, hasMore])

  function handleTagClick(tag: string) {
    const next = activeTag === tag ? null : tag
    setSearch("")
    setActiveTag(next)
    // Apply the tag immediately so it works even with text in the box.
    // The effect above ignores the lagging stale debounce for this render,
    // and its settled run refetches the same tag page (harmless duplicate).
    if (next) {
      void filterByTag(next)
    } else {
      void loadLinks()
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Search links…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button className="ml-auto" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Save link
        </Button>
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto">
          {allTags.map(tag => (
            <Badge
              key={tag}
              variant={activeTag === tag ? "default" : "outline"}
              className="cursor-pointer text-xs font-normal"
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
              <Skeleton className="size-8 rounded shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className={cn("flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground")}>
          <Link2 className="size-10 opacity-20" />
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              {debouncedSearch || activeTag ? "No links match your search" : "No links yet"}
            </p>
            <p className="text-xs opacity-70">
              {debouncedSearch || activeTag ? "Try a different search or tag" : "Save your first link to get started"}
            </p>
          </div>
        </div>
      ) : (
        /* Scroll container — virtualizer measures this */
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
          {/* Total height sizer — keeps the scrollbar accurate */}
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map(item => (
              <div
                key={item.key}
                data-index={item.index}
                ref={virtualizer.measureElement}
                style={{ position: "absolute", top: 0, left: 0, right: 0, transform: `translateY(${item.start}px)` }}
                className="pb-2"
              >
                <LinkListItem
                  link={links[item.index]}
                  onTagClick={handleTagClick}
                />
              </div>
            ))}
          </div>
          {/* Infinite-scroll sentinel + loading indicator */}
          <div ref={sentinelRef} className="h-px" />
          {loadingMore && (
            <div className="space-y-2 py-2">
              {[1, 2].map(i => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                  <Skeleton className="size-8 rounded shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AddLinkDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
