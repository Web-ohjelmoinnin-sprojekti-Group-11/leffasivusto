import { useState } from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import RandomPickerModal from "../picker/RandomPickerModal.jsx";

export default function FiltersBar({ onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const filters = [
    { key: "year",       label: String(new Date().getFullYear()), params: { year: new Date().getFullYear() } },
    { key: "minRating8", label: "⭐ 8+",                          params: { minRating: 8 } },
    { key: "scifi",      label: "Sci-Fi",                        params: { genres: 878 } },
    { key: "doc",        label: "Documentary",                   params: { genres: 99 } },
    { key: "anim",       label: "Animation",                     params: { genres: 16 } },
    { key: "fantasy",    label: "Fantasy",                       params: { genres: 14 } },
  ];

  const handle = (f) => onChange?.(f);

  return (
    <>
      {/* Curated-kokoelmat */}
      <div className="d-flex flex-wrap gap-2 align-items-center mb-2 filter-chips">
        <span className="small text-muted me-1">Collections:</span>
        <Button
          size="sm"
          variant="outline-primary"
          onClick={() =>
            onChange?.({ key: "curated-top", label: "Top 100", mode: "curated", params: { kind: "top", size: 100, minVotes: 1000 } })
          }
        >
          Top 100
        </Button>
        <Button
          size="sm"
          variant="outline-primary"
          onClick={() =>
            onChange?.({ key: "curated-new", label: "Newest 100", mode: "curated", params: { kind: "new", size: 100 } })
          }
        >
          Newest 100
        </Button>
      </div>

      {/* Discover-painikkeet */}
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3 filter-chips">
        <ButtonGroup size="sm">
          <Button variant="outline-primary" onClick={() => handle(filters[0])}>
            {filters[0].label}
          </Button>
          <Button variant="outline-primary" onClick={() => handle(filters[1])}>
            {filters[1].label}
          </Button>
        </ButtonGroup>

        {filters.slice(2).map((f) => (
          <Button key={f.key} size="sm" variant="outline-primary" onClick={() => handle(f)}>
            {f.label}
          </Button>
        ))}

        <div className="ms-auto d-flex align-items-center">
          <Button
            variant="primary"
            className="rounded-pill"
            onClick={() => setPickerOpen(true)}
            title="Random Movie Picker"
            aria-label="Open Random Movie Picker"
          >
            🎲 Random
          </Button>
        </div>
      </div>

      <RandomPickerModal show={pickerOpen} onHide={() => setPickerOpen(false)} />
    </>
  );
}
