import request from "supertest";
import { expect } from "chai";
import app from "../server/app.js"; // App tulee olla ES-moduulissa

describe("Reviews API", () => {
  
  it("Arvostelujen selaaminen onnistuu (200)", async () => {
    const res = await request(app).get("/api/reviews?movie_id=1");

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
  });

  // **Negatiiviset testit arvostelujen selaamisesta**

  it("Arvostelujen selaaminen epäonnistuu ilman movie_id-parametria (400)", async () => {
    const res = await request(app).get("/api/reviews");

    // Korjattu virheviestin tarkistus
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("error").that.equals("movie_id query parameter is required");
  });

  it("Arvostelujen selaaminen epäonnistuu virheellisellä movie_id-arvolla (400)", async () => {
    const res = await request(app).get("/api/reviews?movie_id=invalid");

    // Korjattu virheviestin tarkistus
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("error").that.equals("Invalid movie_id");
  });
});
