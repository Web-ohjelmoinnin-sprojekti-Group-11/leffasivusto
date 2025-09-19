// src/components/search/SearchBar.jsx
import React, { useState } from "react";
import { Form, InputGroup, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function SearchBar({ size = "lg", className = "", onSubmit }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submit = () => {
    const query = q.trim();
    if (!query) return;
    onSubmit?.(query);
    navigate(`/movies?q=${encodeURIComponent(query)}&page=1`);
  };

  return (
    <Form
      className={className}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <InputGroup size={size}>
        <Form.Control
          placeholder="Search ..."
          aria-label="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button variant="primary" type="submit">Search</Button>
      </InputGroup>
    </Form>
  );
}
