// src/components/layout/SidebarShowtimes.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Card, Form, ListGroup, Button, Row, Col } from "react-bootstrap";
import { useTheatres } from "../../hooks/useTheatres";
import { useSchedule } from "../../hooks/useSchedule";
import api from "../../services/api";
import { getToken } from "../../services/token";

/**
 * Jos prop groupId on annettu (esim. ryhmäsivulla),
 * "Share to group" lähettää suoraan tähän ryhmään.
 * Muussa tapauksessa näytetään pudotuslista omista ryhmistä.
 */
export default function SidebarShowtimes({ groupId = null }) {
  const theatresRaw = useTheatres();

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // share-to-group
  const [myGroups, setMyGroups] = useState([]);
  const [targetGroup, setTargetGroup] = useState("");

  // Oletuksena tämän päivän päivämäärä (dd.mm.yyyy)
  useEffect(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    setSelectedDate(`${dd}.${mm}.${yyyy}`);
  }, []);

  // Lataa omat ryhmät, jos ei olla ryhmäsivulla
  useEffect(() => {
    const load = async () => {
      if (groupId) return; // ei tarvetta valinnalle
      try {
        const res = await api.get("/groups/mine", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const groups = res.data?.groups || [];
        setMyGroups(groups);
        setTargetGroup(groups[0]?.group_id ?? "");
      } catch {
        setMyGroups([]);
        setTargetGroup("");
      }
    };
    load();
  }, [groupId]);

  // Suodatetaan hassut alueet pois
  const theatres = useMemo(
    () =>
      theatresRaw.filter((t) => {
        const name = t.name.toLowerCase();
        if (name.includes("valitse")) return false;
        if (name.includes(",")) return false;
        return true;
      }),
    [theatresRaw]
  );

  // Näytösdata valitulle teatterialueelle + päivälle
  const schedule = useSchedule(selectedArea, selectedDate);

  // Kaupunkilista
  const cities = useMemo(() => {
    const set = new Set();
    theatres.forEach((t) => {
      const city = t.name.split(":")[0].trim();
      set.add(city);
    });
    return Array.from(set);
  }, [theatres]);

  // Teatterit valitun kaupungin mukaan
  const theatresForCity = useMemo(() => {
    if (!selectedCity) return [];
    return theatres.filter((t) => t.name.startsWith(selectedCity));
  }, [theatres, selectedCity]);

  // Jos kaupungissa vain yksi teatteri → valitse se
  useEffect(() => {
    if (theatresForCity.length === 1) setSelectedArea(theatresForCity[0].id);
    else setSelectedArea("");
  }, [theatresForCity]);

  // Näytä vain valitun päivän näytökset
  const filteredSchedule = selectedDate
    ? schedule.filter((s) => s.date === selectedDate)
    : schedule;

  const canShare = !!getToken() && (!!groupId || !!targetGroup);

  // Lähetä valittu näytös ryhmälle
  const shareOne = async (show) => {
    const gid = groupId || targetGroup;
    if (!gid) return;

    try {
      await api.post(
        `/showtimes/${gid}`,
        {
          title: show.title,
          theatre_name: show.theatre,
          // TÄRKEÄ: backend odottaa erikseen pvm + kellonaika
          date: show.date || selectedDate, // "dd.mm.yyyy"
          showtime: show.time,             // "HH:MM"
          // movie_id on vapaaehtoinen; jos hookisi tarjoaa tmdbId/movieId, lähetetään se
          movie_id: show.tmdbId ?? show.movieId ?? null,
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      alert("Showtime shared to group!");
    } catch (e) {
      console.error("share showtime error", e);
      alert(e?.response?.data?.error || "Failed to share showtime");
    }
  };

  return (
    <Card className="mb-3">
      <Card.Header>Finnkino Showtimes</Card.Header>
      <Card.Body className="d-grid gap-3">
        {/* Kaupunki */}
        <Form.Select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
          <option value="">Select city</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Form.Select>

        {/* Teatteri */}
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

        {/* Päivämäärä */}
        <Form.Control
          type="date"
          value={selectedDate ? selectedDate.split(".").reverse().join("-") : ""}
          onChange={(e) => {
            if (!e.target.value) {
              setSelectedDate("");
              return;
            }
            const [year, month, day] = e.target.value.split("-");
            setSelectedDate(`${day}.${month}.${year}`);
          }}
        />

        {/* Kohderyhmä (vain jos ei olla ryhmäsivulla) */}
        {!groupId && (
          <Row className="g-2">
            <Col xs="auto" className="d-flex align-items-center">
              <small className="text-muted">Share to:</small>
            </Col>
            <Col>
              <Form.Select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                disabled={!myGroups.length}
              >
                {myGroups.length === 0 && <option value="">(no groups)</option>}
                {myGroups.map((g) => (
                  <option key={g.group_id} value={g.group_id}>
                    {g.group_name} {g.role === "admin" ? "(owner)" : ""}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        )}

        {/* Lista */}
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
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!canShare}
                      onClick={() => shareOne(show)}
                    >
                      Share to group
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <p className="text-muted small mb-0">No movies for this selection.</p>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
