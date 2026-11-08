import express from "express";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "book_notes",
  password: "123321paper",
  port: 5432,
});
await db.connect();

app.get("/", async (req, res) => {
  //display homepage
  var sortValue = req.query.sort;
  try {
    if (sortValue === "rating") {
      let ratingSort = await db.query(
        "SELECT * from books ORDER BY rating DESC NULLS LAST",
      );
      res.render("index.ejs", {
        books: ratingSort.rows,
      });
    } else if (sortValue === "date") {
      let dateSort = await db.query(
        "SELECT * from books ORDER BY date_finished ASC",
      );
      res.render("index.ejs", {
        books: dateSort.rows,
      });
    } else {
      let titleSort = await db.query("SELECT * FROM books ORDER BY title ASC");
      res.render("index.ejs", {
        books: titleSort.rows,
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/books", async (req, res) => {
  //display form
  res.render("new-book.ejs");
});
app.post("/books", async (req, res) => {
  //display edit
  var cover_no = null;
  try {
    const cover = await axios.get("https://openlibrary.org/search.json", {
      params: {
        title: req.body.title,
        author: req.body.author,
        limit: 1,
      },
    });
    cover_no = cover.data.docs[0]?.cover_i ?? null;
  } catch (err) {
    console.log(err);
  }
  if (req.body.rating == "") {
    req.body.rating = null;
  }

  await db.query(
    "INSERT INTO books(title,author,rating,date_finished,notes,cover_id) VALUES ($1,$2,$3,$4,$5,$6)",
    [
      req.body.title,
      req.body.author,
      req.body.rating,
      req.body.date_finished,
      req.body.notes,
      cover_no,
    ],
  );
  res.redirect("/");
});

app.get("/books/:id/edit", async (req, res) => {
  //edit
  var id = req.params.id;
  const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);
  res.render("edit-book.ejs", {
    id,
    book: result.rows[0],
  });
});
app.post("/books/:id/edit", async (req, res) => {
  var id = req.params.id;
  if (req.body.rating == "") {
    req.body.rating = null;
  }
  await db.query(
    "UPDATE books SET title = $1, author = $2, rating = $3, date_finished = $4, notes = $5 WHERE id = $6",
    [
      req.body.title,
      req.body.author,
      req.body.rating,
      req.body.date_finished,
      req.body.notes,
      id,
    ],
  );
  res.redirect("/");
});
app.post("/books/:id/delete", async (req, res) => {
  var id = req.params.id;
  await db.query("DELETE FROM books WHERE id = $1", [id]);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
