import type { PageId, PageSpec } from "../state/useActivePage";

export interface PageNavProps {
  pages: PageSpec[];
  active: PageId;
  onPick: (next: PageId) => void;
}

export function PageNav(props: PageNavProps) {
  return (
    <nav className="page-nav">
      {props.pages.map((page) => {
        let className = "page-tab";
        if (page.id === props.active) {
          className = "page-tab is-active";
        }

        return (
          <button
            key={page.id}
            type="button"
            className={className}
            onClick={() => props.onPick(page.id)}
          >
            {page.label}
          </button>
        );
      })}
    </nav>
  );
}
