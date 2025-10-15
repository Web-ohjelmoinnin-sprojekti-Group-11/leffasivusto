import request from "supertest";
import { expect } from "chai";
import app from "../server/app.js"; // App tulee olla ES-moduulissa

describe("Auth API", () => {
  let token;
  let email;

  it("Rekisteröityminen onnistuu validilla datalla (201)", async () => {
    email = `test${Date.now()}@example.com`;

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email, password: "Testi123" });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property("user_id");
  });

  it("Kirjautuminen onnistuu (200)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "Testi123" });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("token");
    token = res.body.token; // Vaihdettiin accessToken -> token
  });

  it("Uloskirjautuminen onnistuu (200)", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("message").that.equals("Logout successful");
  });

  it("Käyttäjän poistaminen onnistuu (200)", async () => {
    const res = await request(app)
      .delete("/api/auth/delete")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("message").that.equals("User deleted successfully");
  });

  // **Negatiiviset testit Auth API**

  it("Rekisteröityminen epäonnistuu virheellisellä sähköpostilla (400)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "invalid-email", password: "Testi123" });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("error").that.equals("Invalid email format");
  });

  it("Kirjautuminen epäonnistuu väärillä tunnuksilla (401)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "WrongPassword123" });

    expect(res.status).to.equal(401); // Muutettiin 400 -> 401
    expect(res.body).to.have.property("error").that.equals("Virheellinen sähköposti tai salasana"); // Muutettiin virheviesti
  });

  it("Uloskirjautuminen epäonnistuu ilman validia tokenia (401)", async () => {
    const res = await request(app)
      .post("/api/auth/logout");

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property("error").that.equals("Token required"); // Muutettiin virheviesti
  });

  it("Käyttäjän poistaminen epäonnistuu ilman validia tokenia (401)", async () => {
    const res = await request(app)
      .delete("/api/auth/delete");

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property("error").that.equals("Missing or invalid Authorization header"); // Muutettiin virheviesti
  });
});
