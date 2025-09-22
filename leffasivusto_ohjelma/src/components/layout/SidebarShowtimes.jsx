// src/components/layout/SidebarShowtimes.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Card, Form, ListGroup, Button } from "react-bootstrap";
import { useTheatres } from "../../hooks/useTheatres";
import { useSchedule } from "../../hooks/useSchedule";

export default function SidebarShowtimes() {
  const theatresRaw = useTheatres();

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Suodatetaan virheelliset alueet pois
  const theatres = useMemo(() => {
    return theatresRaw.filter((t) => {
      const name = t.name.toLowerCase();
      if (name.includes("valitse")) return false;
      if (name.includes(",")) return false; 
      return true;
    });
  }, [theatresRaw]);

  // Oletuksena tämän päivän päivämäärä
  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    setSelectedDate(`${dd}.${mm}.${yyyy}`);
  }, []);


  const schedule = useSchedule(selectedArea, selectedDate);

  const cities = useMemo(() => {
    const set = new Set();
    theatres.forEach((t) => {
      const city = t.name.split(":")[0].trim();
      set.add(city);
    });
    return Array.from(set);
  }, [theatres]);

  // Suodatetaan teatterit valitun kaupungin mukaan
  const theatresForCity = useMemo(() => {
    if (!selectedCity) return [];
    return theatres.filter((t) => t.name.startsWith(selectedCity));
  }, [theatres, selectedCity]);

  // Jos kaupungilla vain yksi teatteri, niin valitaan se automaattisesti
  useEffect(() => {
    if (theatresForCity.length === 1) {
      setSelectedArea(theatresForCity[0].id);
    } else {
      setSelectedArea("");
    }
  }, [theatresForCity]);

  // Suodatetaan valitun päivämäärän mukaan aikataulu
  const filteredSchedule = selectedDate
    ? schedule.filter((s) => s.date === selectedDate)
    : schedule;

  return (
    <Card className="mb-3">
      <Card.Header>Finnkino Showtimes</Card.Header>
      <Card.Body className="d-grid gap-3">
        {/* Kaupungin valintavalikko */}
        <Form.Select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
        >
          <option value="">Select city</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Form.Select>

        {/* Teatterin valintavalikko */}
        <Form.Select
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
          disabled={!selectedCity}
        >
          <option value="">Select theatre</option>
          {theatresForCity.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name.split(":").pop().trim()}
            </option>
          ))}
        </Form.Select>

        {/* Kalenterivalikko */}
        <Form.Control
          type="date"
          value={
            selectedDate ? selectedDate.split(".").reverse().join("-") : ""
          }
          onChange={(e) => {
            if (!e.target.value) {
              setSelectedDate("");
              return;
            }
            const [year, month, day] = e.target.value.split("-");
            setSelectedDate(`${day}.${month}.${year}`);
          }}
        />

        {/* Esitysaikojen listaus */}
        {selectedArea && (
          <div>
            <div className="fw-semibold mb-2">
              {selectedDate ? `${selectedDate} Showtimes` : "All Showtimes"}
            </div>
            {filteredSchedule.length > 0 ? (
              <ListGroup variant="flush">
                {filteredSchedule.map((show, idx) => (
                  <ListGroup.Item
                    key={idx}
                    className="small d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>{show.title}</strong>
                      <br />
                      {show.theatre} — {show.time}
                    </div>
                    <Button size="sm" variant="primary">
                      Book
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <p className="text-muted small mb-0">
                No movies for this selection.
              </p>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}