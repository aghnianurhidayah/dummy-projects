const express = require("express");
const expressLayout = require("express-ejs-layouts");
const { body, validationResult, check } = require("express-validator");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");

require("./utils/db");
const Contact = require("./model/contacts");

const app = express();
const port = 3000;

app.use(methodOverride("_method"));

app.set("view engine", "ejs");
app.use(expressLayout);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser("secret"));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(flash());

app.get("/", (req, res) => {
  res.render("index", {
    title: "Home",
    layout: "layouts/main-layout",
  });
});

app.get("/about", (req, res) => {
  res.render("about", {
    title: "about",
    layout: "layouts/main-layout",
  });
});

app.get("/contact", async (req, res) => {
  const contacts = await Contact.find();
  res.render("contact", {
    title: "Contact",
    layout: "layouts/main-layout",
    contacts,
    msg: req.flash("msg"),
  });
});

app.get("/contact/add", (req, res) => {
  res.render("add-contact", {
    title: "Form tambah data",
    layout: "layouts/main-layout",
  });
});

app.post(
  "/contact",
  [
    body("nama").custom(async (value) => {
      const duplikat = await Contact.findOne({ nama: value });
      if (duplikat) {
        throw new Error("Nama sudah digunakan!");
      }
      return true;
    }),
    check("nohp", "Nomor HP tidak valid!").isMobilePhone("id-ID"),
    check("email", "Email tidak valid!").isEmail(),
  ],
  (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      res.render("add-contact", {
        title: "Form tambah data",
        layout: "layouts/main-layout",
        errors: err.array(),
      });
    } else {
      Contact.insertMany(req.body).then(() => {
        req.flash("msg", "Data berhasil ditambahkan!");
        res.redirect("/contact");
      });
    }
  }
);

app.delete("/contact", (req, res) => {
  Contact.deleteOne({ _id: req.body.id }).then((result) => {
    req.flash("msg", "Data berhasil dihapus!");
    res.redirect("/contact");
  });
});

app.get("/contact/edit/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });
  res.render("edit-contact", {
    title: "Form ubah data",
    layout: "layouts/main-layout",
    contact,
  });
});

app.put(
  "/contact",
  [
    body("nama").custom( async (value, { req }) => {
      const duplikat = await Contact.findOne({ nama: value});
      if (value !== req.body.oldNama && duplikat) {
        throw new Error("Nama sudah digunakan!");
      }
      return true;
    }),
    check("nohp", "Nomor HP tidak valid!").isMobilePhone("id-ID"),
    check("email", "Email tidak valid!").isEmail(),
  ],
  (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) {
      res.render("edit-contact", {
        title: "Form ubah data",
        layout: "layouts/main-layout",
        errors: err.array(),
        contact: req.body,
      });
    } else {
      Contact.updateOne({ _id: req.body._id },
        {
            $set: {
                nama: req.body.nama,
                nohp: req.body.nohp,
                email: req.body.email,
            }
        }
      ).then((result) => {
          req.flash("msg", "Data berhasil diubah!");
          res.redirect("/contact");
      });
    }
  }
);

app.get("/contact/:nama", async (req, res) => {
  const contact = await Contact.findOne({ nama: req.params.nama });
  res.render("detail", {
    title: "Detail Contact",
    layout: "layouts/main-layout",
    contact,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
