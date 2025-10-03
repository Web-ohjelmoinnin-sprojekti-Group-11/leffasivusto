import request from "supertest";
import { expect } from "chai";
import app from "../server/app.js";

describe("Auth API", () => {
  let token;
  let email;

  it("Rekisteröityminen onnistuu validilla datalla (201)", async () => {
    // Uniikki sähköposti joka testikerralla
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
    token = res.body.token; // tallennetaan token seuraavia testejä varten
  });

  it("Uloskirjautuminen onnistuu (200)", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
  });

  it("Käyttäjän poistaminen onnistuu (200)", async () => {
    const res = await request(app)
      .delete("/api/auth/delete")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(200);
  });
});


//