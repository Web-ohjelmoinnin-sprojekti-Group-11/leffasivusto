import request from "supertest";
import { expect } from "chai";
import app from "../server/app.js";

describe("Reviews API", () => {
  it("Arvostelujen selaaminen onnistuu (200)", async () => {
    // Lisää movie_id query-param jotta 400-virhe ei tule
    const res = await request(app).get("/api/reviews?movie_id=1");

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
  });
});
