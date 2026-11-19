import Topbar, { type SearchProps } from "./Topbar";

interface PageHeaderProps {
  title: string;
  description?: string;
  search?: SearchProps;
}

export default function PageHeader({
  title,
  description,
  search,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-[13px] text-muted">{description}</p>
        )}
      </div>

      <Topbar search={search} />
    </header>
  );
}