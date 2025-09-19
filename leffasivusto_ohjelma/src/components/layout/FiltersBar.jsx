// src/components/layout/FiltersBar.jsx
import { Button, ButtonGroup } from "react-bootstrap";

export default function FiltersBar({ onChange }) {
  // mappaus: label -> discover-parametrit
  const filters = [
    { key: "year",        label: String(new Date().getFullYear()), params: { year: new Date().getFullYear() } },
    { key: "minRating8",  label: "⭐ 8+",                           params: { minRating: 8 } },
    { key: "scifi",       label: "Sci-Fi",                         params: { genres: 878 } },       // Sci-Fi
    { key: "doc",         label: "Documentary",                    params: { genres: 99 } },        // Documentary
    { key: "anim",        label: "Animation",                      params: { genres: 16 } },        // Animation
    { key: "fantasy",     label: "Fantasy",                        params: { genres: 14 } }
  ];

  const handle = (f) => {
    // palautetaan valitut discover-parametrit ylös Home:lle
    onChange?.(f);
  };

  return (
    <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
      <ButtonGroup>
        <Button variant="outline-secondary" onClick={() => handle(filters[0])}>
          {filters[0].label}
        </Button>
        <Button variant="outline-secondary" onClick={() => handle(filters[1])}>
          {filters[1].label}
        </Button>
      </ButtonGroup>

      {filters.slice(2).map((f) => (
        <Button key={f.key} variant="outline-secondary" onClick={() => handle(f)}>
          {f.label}
        </Button>
      ))}
    </div>
  );
}
