const dotenv = require("dotenv");
dotenv.config({ path: "Config/.env" });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const cookieParser = require('cookie-parser');
const mysqlconnection = require('./connect');
const secretKey = "hdtjkyowi3u487toysggho";
const app = express();

const saltRounds = 10;
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];


const corsOptions = {
  origin: (origin, callback) => {
    console.log(`Origin: ${origin}`);
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET, POST, PUT, DELETE, PATCH, HEAD',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

// Routes
app.get('/employee', (req, res) => {
  mysqlconnection.query('SELECT * FROM employee', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while retrieving data' });
    } else {
      console.log(rows);
      res.status(200).json(rows);
    }
  });
});

app.get('/employee/:id', (req, res) => {
  mysqlconnection.query('SELECT * FROM employee WHERE id=?', [req.params.id], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while retrieving data' });
    } else {
      console.log(rows);
      res.status(200).json(rows);
    }
  });
});

app.delete('/delete/:id', (req, res) => {
  mysqlconnection.query('DELETE FROM employee WHERE id=?', [req.params.id], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while deleting data' });
    } else {
      console.log(rows);
      res.status(200).json({ msg: 'Delete operation successful' });
    }
  });
});

app.post('/insert-data', (req, res) => {
  const emp = req.body;
  const empData = [emp.name, emp.position, emp.salary];
  if (!emp.name || !emp.position || !emp.salary) {
    return res.status(400).json({ error: 'All fields (name, position, salary) are required' });
  }

  mysqlconnection.query('INSERT INTO employee (name, position, salary) VALUES (?, ?, ?)', empData, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while inserting data' });
    } else {
      console.log(result);
      res.status(200).json({ msg: 'Data inserted successfully' });
    }
  });
});

app.patch('/update-data', (req, res) => {
  const emp = req.body;
  const empId = emp.id;

  if (!empId) {
    return res.status(400).json({ error: 'Employee ID is required' });
  }

  const updateFields = {};
  if (emp.name) updateFields.name = emp.name;
  if (emp.position) updateFields.position = emp.position;
  if (emp.salary) updateFields.salary = emp.salary;

  mysqlconnection.query('UPDATE employee SET ? WHERE id = ?', [updateFields, empId], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while updating data' });
    } else {
      console.log(result);
      res.status(200).json({ msg: 'Data updated successfully' });
    }
  });
});

//<===============Register page==================>//

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  // Validate input fields
  if (!name || !email || !password) {
      return res.status(400).json({ msg: 'All fields are required' });
  }

  const sql = "INSERT INTO login (`name`, `email`, `password`) VALUES (?)";

  // Hash the password
  bcrypt.hash(password.toString(), saltRounds, (err, hash) => {
      if (err) {
          return res.status(500).json({ msg: 'Error hashing password' });
      }

      const values = [name, email, hash];

      // Insert user data into the database
      mysqlconnection.query(sql, [values], (err, result) => {
          if (err) {
              console.error('Database Insertion Error: ', err);
              return res.status(500).json({ Error: 'Inserting error from database', details: err });
          }
          return res.status(201).json({ msg: 'Registered successfully' });
      });
  });
});



//==============login page===============>//


app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
  }

  const sql = 'SELECT * FROM login WHERE email = ?';
  mysqlconnection.query(sql, [email], (err, result) => {
      if (err) {
          console.error(err);
          return res.status(500).json({ msg: 'Database query error' });
      }

      if (result.length === 0) {
          return res.status(400).json({ msg: 'Invalid email or password' });
      }

      const user = result[0];

      bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
              console.error(err);
              return res.status(500).json({ msg: 'Error comparing passwords' });
          }

          if (!isMatch) {
              return res.status(400).json({ msg: 'Invalid email or password' });
          }

          const token = jwt.sign({ id: user.id, email: user.email }, secretKey, { expiresIn: '1h' });

          res.cookie('token', token, { httpOnly: true });
          return res.status(200).json({ msg: 'Login successful', token });
      });
  });
});


app.listen(process.env.PORT, () => {
  console.log('Server is running on port 5000');
});
