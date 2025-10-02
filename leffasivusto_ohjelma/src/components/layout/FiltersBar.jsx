// src/components/layout/FiltersBar.jsx
import { useState } from "react";
import { Button, ButtonGroup } from "react-bootstrap";
import RandomPickerModal from "../picker/RandomPickerModal.jsx";

export default function FiltersBar({ onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  // mappaus: label -> discover-parametrit
  const filters = [
    { key: "year",        label: String(new Date().getFullYear()), params: { year: new Date().getFullYear() } },
    { key: "minRating8",  label: "⭐ 8+",                           params: { minRating: 8 } },
    { key: "scifi",       label: "Sci-Fi",                         params: { genres: 878 } },       // Sci-Fi
    { key: "doc",         label: "Documentary",                    params: { genres: 99 } },        // Documentary
    { key: "anim",        label: "Animation",                      params: { genres: 16 } },        // Animation
    { key: "fantasy",     label: "Fantasy",                        params: { genres: 14 } }
  ];

  const handle = (f) => onChange?.(f);

  return (
    <>
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

        {/* Random Movie Picker nappi oikeaan reunaan */}
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
